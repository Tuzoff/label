export const LOAD_IMAGE               = 'LOAD_IMAGE';
export const CLEAR_IMAGE              = 'CLEAR_IMAGE';
export const REVERT_IMAGE             = 'REVERT_IMAGE';

export const DRAW_NEW_BOX             = 'DRAW_NEW_BOX';
export const ADD_NEW_BOX              = 'ADD_NEW_BOX';
export const CLEAR_NEW_BOX            = 'CLEAR_NEW_BOX';

export const UPDATE_BOX               = 'UPDATE_BOX';
export const DELETE_BOX               = 'DELETE_BOX';

export const LOAD_LABEL_CONFIG        = 'LOAD_LABEL_CONFIG';
export const ADD_BOX_LABEL            = 'ADD_BOX_LABEL';
export const DELETE_BOX_LABELS        = 'DELETE_BOX_LABELS';
export const TOGGLE_BOX_LABEL         = 'TOGGLE_BOX_LABEL';


export const loadImage = (boxes, history) => ({
  type: LOAD_IMAGE,
  payload: { boxes, history },
});

export const clearImage = () => ({ type: CLEAR_IMAGE });

export const revertImage = () => ({ type: REVERT_IMAGE });

export const addLabelForBoxAtIndex = (index, label) => {
  return (dispatch, getState) => {
    const state = getState();

    let isLabelValid = false;

    // check label mutual exclusivity
    let owningGroup = null;

    state.labels.config.groups.forEach(group => {
      if (group.labels.indexOf(label) > -1) {
        owningGroup = group;
      }
    });

    // if the label's group is a mutually exclusive group and the label
    // already exist on the image, then the label is invalid
    // if (owningGroup.areLabelsMutuallyExclusive) {
    if (owningGroup.areLabelsUniqueOnImage) {
      let doesLabelExistOnImage = false;

      for (let i = 0; i < state.image.boxes.length; i++) {
        let boxLabels = state.image.boxes[i].labels || [];

        for (let j = 0; j < boxLabels.length; j++) {
          if (label === boxLabels[j]) {
            doesLabelExistOnImage = true;
            break;
          }
        }
      }

      isLabelValid = !doesLabelExistOnImage;

    } else {
      isLabelValid = true;
    }

    if (isLabelValid) {
      // there can only be one member of a mutually exclusive group's labels
      // associated with any given box. so we delete all other group members
      // from this box before we add the new label.
      if (owningGroup !== null) {
        dispatch({
          type: DELETE_BOX_LABELS,
          payload: { index, labels: owningGroup.labels },
        });
      }

      dispatch({
        type: ADD_BOX_LABEL,
        payload: { index, label }
      });
    }
  };
};

export const drawNewBox = (dimensions) => ({
  type: DRAW_NEW_BOX,
  payload: dimensions,
});

export const addNewBox = () => {
  return (dispatch, getState) => {
    const state = getState();

    // we check to see if there are any sequential labels on existing boxes.
    // if there are, we automatically add the next label in each sequence.
    const sequentialGroups = state.labels.config.groups.filter(group => group.isSequential);

    let existingLabels = [];

    state.image.boxes.forEach(box => {
      if (box.labels !== undefined) {
        box.labels.forEach(label => {
          if (existingLabels.indexOf(label) === -1) {
            existingLabels.push(label);
          }
        });
      }
    });

    let sequences = [];

    sequentialGroups.forEach(group => {
      for (let i = group.labels.length - 1; i >= 0; i--) {
        if (existingLabels.indexOf(group.labels[i]) > -1) {
          sequences.push({ groupId: group.id, lastIndexInGroup: i });
          break;
        }
      }
    });

    const newBoxIndex = state.image.boxes.length;

    dispatch({ type: ADD_NEW_BOX });

    sequences.forEach(sequence => {
      const group = sequentialGroups.find(g => g.id === sequence.groupId);

      const nextLabel = group.labels[sequence.lastIndexInGroup + 1];

      if (nextLabel !== undefined) {
        dispatch(addLabelForBoxAtIndex(newBoxIndex, nextLabel));
      }
    });
  };
};

export const clearNewBox = () => ({ type: CLEAR_NEW_BOX });

export const updateBoxAtIndex = (index, newDimensions) => ({
  type: UPDATE_BOX,
  payload: { index, newDimensions },
});

export const deleteBoxAtIndex = (index) => ({
  type: DELETE_BOX,
  payload: index,
});

export const loadLabelConfig = (config) => ({
  type: LOAD_LABEL_CONFIG,
  payload: config,
});

export const deleteLabelsForBoxAtIndex = (index, labels) => ({
  type: DELETE_BOX_LABELS,
  payload: { index, labels },
});

export const toggleLabelForBoxAtIndex = (index, label) => ({
  type: TOGGLE_BOX_LABEL,
  payload: { index, label },
});
