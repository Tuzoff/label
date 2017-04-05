# coding=utf-8
import pandas as pd


def export_to_csv():
    a = [
        "https://s3-eu-west-1.amazonaws.com/d-pan1/-2.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/123.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/20081022_47880.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-06-02_101510.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-06-17_173135.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-07-04_145647.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-07-05_132944.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-07-07_114116.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-07-08_110714.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-07-11_120915.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-07-11_170626.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-07-11_185305.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-08-31_181152.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2011-11-18_11.01.14.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2012-04-09_163406.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/2012-08-17_105356.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/20120118_84662.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/20120126_84832.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/20120207_85127.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/20120209_85194.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/20120223_85546.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/25.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/36zubov.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/417.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/500178-fx6.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/BUDAEVA.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/MDlmZTI2OGI.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/MGU2MmExNmQ4.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/P%D0%A0%D0%BE%D0%B4%D0%B8%D0%BE%D0%BD%D0%BE%D0%B2%D0%B0.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/P20110628_091800_0000.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/P34.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/Y2YxYjJkNDc.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/YTIzNmM2Nzk.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/ZDJmNTM1Mjkz.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/ZWJlZWE4MzEy.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/__.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/extrazubi.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/july2011.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/multi_caries.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/optg_ccd_sensor.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/optg_cmos_sensor.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/p20131216_165044_0000.bmp",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/pereimplantit.jpg",
        "https://s3-eu-west-1.amazonaws.com/d-pan1/pereimplantit1.jpg"
    ]

    a_df = pd.Series.from_array(a)
    a_df.to_csv('files.csv', index=False)