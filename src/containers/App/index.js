import React, { Component } from 'react';
import axios from 'axios';
import moment from 'moment';

import { Link, Redirect } from 'react-router-dom';
import { DateRangePicker } from 'react-dates';

import 'react-dates/lib/css/_datepicker.css';

import Image from '../Image';
import Modal from 'simple-react-modal';
import {
  S3_BUCKET_URL,
  LABEL_CONFIG_FILE_URL,
  CHECK_IMAGE_DIRTY_INTERVAL,
  FLASH_ALERT_ONSCREEN_TIME
} from '../../constants';
import {
  getBucketImageList,
  uploadJSONToBucket,
  downloadJSONFromBucket
} from '../../util/io';
import {
  loadImage,
  clearImage,
  revertImage,
  loadLabelConfig
} from '../../actions';
import { connect } from 'react-redux';
import './App.css';

import { findLabel } from '../../util/helpers';

const direction = {
  forward: 'forward',
  backward: 'backward'
};

class App extends Component {
  constructor(props) {
    super(props);
    let paramsPhotoId = '';
    if (props.match.params.photoId) paramsPhotoId = props.match.params.photoId;
    this.state = {
      currentImageUrl: null,
      currentImageIndex: this.findIndexOfCurrentPhoto(paramsPhotoId),
      hasErroredOnLoad: false,
      isCurrentImageClean: true,
      showModal: false,
      navAttempt: null,
      showLabelled: false,
      isSaving: false,
      isSaved: false,
      nextImageUrl: null,
      prevImageUrl: null,
      showLabels: true,
      filterText: '',
      bucketContents: {},
      filtered: [],
      paramsPhotoId
    };

    this.mainList = [];
    this.jsonList = [];
    this.notLabelledList = [];
    this.list = [];
    this.allData = [];
  }

  componentDidMount = () => {
    this.getAllData();
    downloadJSONFromBucket(LABEL_CONFIG_FILE_URL, config => {
      this.props.action.loadLabelConfig(config);
    });

    setInterval(() => this.tick(), CHECK_IMAGE_DIRTY_INTERVAL);
  };
  setFilters = () => {
    const parsedFromDate = this.state.startDate
      ? moment(this.state.startDate).unix()
      : 0;
    const parsedToDate = this.state.endDate
      ? moment(this.state.endDate).unix()
      : 9993737837;
    const filtered = [];
    for (let id of this.allData) {
      const lastUpdate = moment(id.lastUpdate).unix() || moment().unix();
      const filtredByText = this.state.filterText
        ? findLabel(id, this.state.filterText)
        : true;
      if (
        filtredByText &&
        lastUpdate >= parsedFromDate &&
        lastUpdate <= parsedToDate
      ) {
        filtered.push(id.url);
      }
    }
    this.setState({ filtered });
  };
  handleInput = value => {
    this.setState({ filterText: value });
  };
  clearFiltering = () => {
    this.setState({ filtered: this.mainList, filterText: '' });
  };
  getAllData = () => {
    getBucketImageList(response => {
      this.jsonList = response.jsonList;
      this.mainList = response.list;
      this.notLabelledList = this.getImageWithoutLabels();
      this.list = this.mainList;
      const idx = this.findIndexOfCurrentPhoto(this.state.paramsPhotoId);
      this.setAndCheckImageAtIndex(idx, false);
      this.setState({ bucketContents: response.bucketContents });
      this.getAllImageData(this.mainList);
    });
  };
  getImagesWithLabel(o, id) {}
  findIndexOfCurrentPhoto = val => {
    if (this.list && val) {
      return this.list.indexOf(val);
    }
    return 0;
  };
  getImageWithoutLabels() {
    const diff = (a, b) => a.filter(i => b.indexOf(i) < 0);
    return diff(this.mainList, this.jsonList);
  }
  shouldComponentUpdate(nextProps, nextState) {
    return nextProps !== this.props || nextState !== this.state;
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.match.params.photoId !== this.props.match.params.photoId) {
      const idx = this.findIndexOfCurrentPhoto(nextProps.match.params.photoId);
      this.setAndCheckImageAtIndex(idx, false);
      this.setState({
        currentImageIndex: idx,
        paramsPhotoId: nextProps.match.params.photoId
      });
    }
    if (nextState.showLabelled !== this.state.showLabelled) {
      this.toggleImages();
    }
    if (nextState.filtered !== this.state.filtered) {
      this.filteredImages(nextState.filtered);
    }
  }
  toggleImages() {
    if (!this.state.showLabelled) {
      this.list = this.notLabelledList;
    } else {
      this.list = this.mainList;
    }
    this.props.history.push('/');
    this.setAndCheckImageAtIndex(0, false);
  }

  filteredImages(data) {
    this.list = data;
    this.props.history.push('/');
    this.setAndCheckImageAtIndex(0, false);
  }
  /**
   * Check if image needs saving and update state
   *
   * @return {void}
   */
  tick() {
    this.setState(prevState => ({
      isCurrentImageClean: this.isCurrentImageClean()
    }));
  }

  /**
   * Check the URL given to make sure it loads without error
   *
   * @param {string} url
   * @return {void}
   */
  checkUrl(url) {
    axios
      .head(url)
      .then(response => this.setState({ hasErroredOnLoad: false }))
      .catch(error => this.setState({ hasErroredOnLoad: true }));
  }

  /**
   * Set the current image to be the one at the given index and check its
   * URL
   *
   * @param {number} index
   * @param {boolean} clear the current image first
   * @return {void}
   */
  setAndCheckImageAtIndex(index, clear = true) {
    if (clear) {
      this.props.action.clearImage();
    }

    const currentImageUrl = `${S3_BUCKET_URL}/${this.list[index]}`;

    const prevImageUrl = `${S3_BUCKET_URL}/${this.list[this.getNextImageIndexGoingIn(direction.backward, index)]}`;
    const nextImageUrl = `${S3_BUCKET_URL}/${this.list[this.getNextImageIndexGoingIn(direction.forward, index)]}`;
    this.setState({
      currentImageIndex: index,
      currentImageUrl,
      prevImageUrl,
      nextImageUrl,
      showModal: false,
      navAttempt: null
    });

    this.checkUrl(currentImageUrl);

    this.loadImageBoxes(currentImageUrl);
  }

  /**
   * Load previous image in image list
   *
   * @param {boolean} [force]
   * @return {void}
   */
  prevImage(force = false) {
    if (!force && this.isCurrentImageDirty()) {
      this.setState({ showModal: true, navAttempt: this.prevImage.bind(this) });
      return;
    }

    this.setAndCheckImageAtIndex(
      this.getNextImageIndexGoingIn(direction.backward)
    );
  }

  /**
   * Load next image in image list
   *
   * @param {boolean} [force]
   * @return {void}
   */
  nextImage(force = false) {
    if (!force && this.isCurrentImageDirty()) {
      this.setState({ showModal: true, navAttempt: this.nextImage.bind(this) });
      return;
    }

    this.setAndCheckImageAtIndex(
      this.getNextImageIndexGoingIn(direction.forward)
    );
  }

  /**
   * Retrieve the index of the next image in rotation
   *
   * @param {string} dir direction of rotation (forward or backward)
   * @param {number} [currentIndex] index to use as current in rotation
   * @return {number|null}
   */
  getNextImageIndexGoingIn(dir, currentIndex = this.state.currentImageIndex) {
    let nextIndex = null;

    if (dir === direction.forward) {
      nextIndex = currentIndex + 1;

      if (nextIndex === this.list.length) {
        nextIndex = 0;
      }
    } else if (dir === direction.backward) {
      nextIndex = currentIndex - 1;

      if (nextIndex === -1) {
        nextIndex = this.list.length - 1;
      }
    }

    return nextIndex;
  }
  getAllImageData(list) {
    for (let url of list) {
      downloadJSONFromBucket(
        this.getJSONFileNameForImage(url),
        data => {
          this.allData.push({
            url,
            labels: data.currentBoxes,
            lastUpdate: moment(data.lastUpdate, 'MM-DD-YYYY-h:mm:ss-a').unix()
          });
        },
        error => {
          console.log(error);
        }
      );
    }
  }
  loadImageBoxes(url) {
    downloadJSONFromBucket(
      this.getJSONFileNameForImage(url),
      data => {
        this.props.action.loadImage(data.currentBoxes, data.history);
      },
      error => {
        console.log(error);

        this.props.action.clearImage();
      }
    );
  }

  saveCurrentImage() {
    if (this.isCurrentImageClean()) {
      return;
    }

    this.setState({ isSaving: true });
    const currentBoxes = this.props.image.boxes;

    const history = this.props.image.history || {};
    const timestamp = moment.utc().format('MM-DD-YYYY-h:mm:ss-a');
    history[timestamp] = currentBoxes;

    uploadJSONToBucket(
      this.getJSONFileNameForImage(this.state.currentImageUrl),
      {
        currentBoxes,
        history,
        lastUpdate: timestamp
      },
      () => {
        this.getAllData();
        this.setState({ isSaved: true });

        setTimeout(() => {
          this.setState({
            isSaving: false,
            isSaved: false,
            isCurrentImageClean: true
          });

          this.props.action.loadImage(currentBoxes, history);
        }, FLASH_ALERT_ONSCREEN_TIME);
      }
    );
  }

  revertCurrentImage() {
    if (this.isCurrentImageClean()) {
      return;
    }

    this.props.action.revertImage();
  }

  isCurrentImageClean() {
    const { prevBoxes, boxes } = this.props.image;

    return JSON.stringify(prevBoxes) === JSON.stringify(boxes);
  }

  isCurrentImageDirty() {
    return !this.isCurrentImageClean();
  }

  getJSONFileNameForImage(url) {
    return url.substring(url.lastIndexOf('/') + 1) + '.json';
  }

  handleModalConfirmation(event) {
    this.state.navAttempt(true);
  }

  handlModalCancellation(event) {
    this.setState({
      showModal: false,
      navAttempt: null
    });
  }
  getNextImage(direction) {
    const idx = this.getNextImageIndexGoingIn(direction);
    return this.list[idx];
  }
  toggleLabel = () => {
    this.setState(prevState => {
      return { showLabels: !prevState.showLabels };
    });
  };
  render() {
    return (
      <div className="App">
        {this.list[0] &&
          !this.props.match.params.photoId &&
          <Redirect to={`/${this.list[0]}`} />}
        <Modal
          show={this.state.showModal}
          containerStyle={{ borderRadius: '4px' }}
        >
          <div className="App__ModalContent">
            <p>
              This image has unsaved changes. Are you sure you want to navigate away?
            </p>

            <button onClick={e => this.handleModalConfirmation(e)}>Yes</button>
            &nbsp;
            <button onClick={e => this.handlModalCancellation(e)}>
              Cancel, stay a while
            </button>
          </div>
        </Modal>

        <div className="App__ControlBar">
          <button
            className="App__NavButton App__NavButton--Prev"
            disabled={this.state.isSaving}
          >
            <Link to={`${this.getNextImage('backward')}`}>
              &larr;
            </Link>

          </button>

          <button
            onClick={() => this.nextImage()}
            className="App__NavButton App__NavButton--Next"
            disabled={this.state.isSaving}
          >
            <Link to={`${this.getNextImage('forward')}`}>
              &rarr;
            </Link>
          </button>
          <button onClick={() => this.toggleLabel()}>
            {this.state.showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
          <button
            onClick={() =>
              this.setState(prevState => {
                return { showLabelled: !prevState.showLabelled };
              })}
          >
            {!this.state.showLabelled ? 'Show Not Labelled' : 'Show Labelled'}

          </button>
          <div className="checkbox">
            <label>
              <input
                type="checkbox"
                onChange={() =>
                  this.setState(prevState => ({
                    freezeLabels: !prevState.freezeLabels
                  }))}
              />
              <small>Freeze Boxes</small>
            </label>
          </div>
          <div>
            <small>filter by date: </small>
            <DateRangePicker
              startDate={this.state.startDate}
              endDate={this.state.endDate}
              onDatesChange={({ startDate, endDate }) =>
                this.setState({ startDate, endDate })}
              focusedInput={this.state.focusedInput}
              onFocusChange={focusedInput => this.setState({ focusedInput })}
              enableOutsideDays
              isOutsideRange={() => null}
            />
          </div>
          <div>
            <input
              type="text"
              onChange={e => this.handleInput(e.target.value)}
              value={this.state.filterText}
              placeholder="filter by label name"
              className="App__Input"
            />
            <button
              onClick={() => this.setFilters()}
              className="App__Button App__Button--small App__Button--Primary"
            >
              filter
            </button>
            <button
              onClick={() => this.clearFiltering()}
              className="App__Button App__Button--small App__Button--Danger"
            >
              clear
            </button>
          </div>
          <div>{this.state.currentImageIndex + 1}/{this.mainList.length}</div>
          {/*<div>{this.jsonList.length}/{this.mainList.length}</div>*/}
          <button
            className="App__Button App__Button--Primary"
            disabled={this.state.isCurrentImageClean}
            onClick={e => this.saveCurrentImage()}
          >
            {this.state.isSaved && '👌 All done'}

            {!this.state.isSaved &&
              (this.state.isSaving ? 'Saving...' : 'Save')}
          </button>

          <button
            className="App__Button App__Button--Danger"
            disabled={this.state.isCurrentImageClean || this.state.isSaving}
            onClick={e => this.revertCurrentImage()}
          >
            Revert
          </button>
        </div>

        <div className="App__Image">
          {this.state.currentImageUrl &&
            <Image
              url={this.state.currentImageUrl}
              error={this.state.hasErroredOnLoad}
              showLabels={this.state.showLabels}
              freezeLabels={this.state.freezeLabels}
            />}
        </div>

        <div className="App__PreloadedImages" style={{ display: 'none' }}>
          {this.state.prevImageUrl &&
            <img src={this.state.prevImageUrl} role="presentation" />}
          {this.state.nextImageUrl &&
            <img src={this.state.nextImageUrl} role="presentation" />}
        </div>
      </div>
    );
  }
} // --- // --- Connect Redux // ---
const mapStateToProps = state => ({
  image: state.image
});
const mapDispatchToProps = dispatch => ({
  action: {
    loadLabelConfig: config => dispatch(loadLabelConfig(config)),
    loadImage: (boxes, history) => dispatch(loadImage(boxes, history)),
    clearImage: () => dispatch(clearImage()),
    revertImage: () => dispatch(revertImage())
  }
});
export default connect(mapStateToProps, mapDispatchToProps)(App);
