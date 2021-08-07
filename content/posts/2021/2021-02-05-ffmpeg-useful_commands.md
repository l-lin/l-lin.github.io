---
title: "FFmpeg - useful commands"
date: 2021-02-05T10:56:06+01:00
tags: ["ffmpeg"]
categories: ["post"]
---

<!--more-->

```bash
# show streams infos
ffprobe -loglevel 16 -show_streams -show_private_data -print_format flat -i input.mp4

# display the frame timestamps with their associated coded picture number (== encoding order)
# /!\ coded_picture_number != frame number
# If there are no B-frames, the coded_picture_number is the same as the frame number
ffprobe input.mp4 -select_streams v -show_entries frame=coded_picture_number,pkt_pts_time -of csv=p=0:nk=1 -v 0 -pretty | less

# cut video without from 10s to 20s
# using "-vcodec copy" to take the input codec => no re-encoding
# may only work if the video do not contain any B-frame
ffmpeg -ss 10 -to 20 -i input.mp4 -vcodec copy out.mp4

# to concat multiple videos, we need to create a text file containing all the videos to concatenate in order
cat << EOF > files.txt
file 'gap.mp4'
file 'original_left.mp4'
file 'original_right.mp4'
EOF
ffmpeg -f concat -i files.txt -c copy concatenated_video.mp4

# concatenate images from folder into a video
for f in *.jpg; do echo "file '$f'" >> to_video.txt; done
# -r 0.5: show every image for 2 seconds
ffmpeg -r 0.5 -f concat -i to_video.txt -vcodec libx264 video.mp4
rm to_video.txt

# check if a video has B-frames (0: no b-frames, 2: has b-frames)
ffprobe -loglevel 16 -show_streams -show_private_data -print_format flat -i input.mp4 | grep has_b_frames

# check I/P/B-frame type for each frame
ffprobe -loglevel 16 -show_frames input.mp4 | grep pict_type | less

# generate video with timestamp & pts drawn behind black screen
ffmpeg \
  # libavfilter input virtual device, needed to generate the black background
  -f lavfi \
  # read source at its native frame rate
  -re \
  # create a black background
  -i color=size=1280x720:duration=20:rate=25:color=black \
  # settb=AVTB: force timestamp to default AVTB which is 10e-6 to have timestamp in us
  # setpts='trunc(PTS/1K)*1K+st(1,trunc(RTCTIME/1K))-1K*trunc(ld(1)/1K)': truncate
  # credit: https://stackoverflow.com/a/47551016/3612053
  -vf "settb=AVTB,setpts='trunc(PTS/1K)*1K+st(1,trunc(RTCTIME/1K))-1K*trunc(ld(1)/1K)',drawtext=text='%{localtime}.%{eif\:1M*t-1K*trunc(t*1K)\:d}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=80:fontcolor=white,drawtext=text='%{pts}':x=(w-text_w)/2:y=500:fontsize=50:fontcolor=white@0.8" \
  output.mp4

# live stream video with timestamp indefinitely (need a RTMP server)
ffmpeg \
  -stream_loop 1 \
  # libavfilter input virtual device, needed to generate the black background
  -f lavfi \
  # read source at its native frame rate
  -re \
  # create a black background
  -i color=size=1280x720:rate=25:color=black \
  # settb=AVTB: force timestamp to default AVTB which is 10e-6 to have timestamp in us
  # setpts='trunc(PTS/1K)*1K+st(1,trunc(RTCTIME/1K))-1K*trunc(ld(1)/1K)': truncate
  # credit: https://stackoverflow.com/a/47551016/3612053
  -vf "settb=AVTB,setpts='trunc(PTS/1K)*1K+st(1,trunc(RTCTIME/1K))-1K*trunc(ld(1)/1K)',drawtext=text='%{localtime}.%{eif\:1M*t-1K*trunc(t*1K)\:d}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=80:fontcolor=white" \
  # use the libx264 for producing an optimized h264 file, with the "High Profile" setting, which is
  # the primary profile for broadcast and disc storage applications, particulary for high-definition
  # tv applications, and by using the veryfast preset
  -c:v libx264 -profile:v high -level:v 4.1 -preset veryfast \
  # produce a file that stays in the 3000-6000 video bitrate range (required by YouTube for example)
  -b:v 3000k -maxrate 3000k -bufsize 6000k \
  # use a specific chroma subsampling scheme named 4:2:0 planar, used for compatibility reasons,
  # since output must be playable across differet players and platforms
  -pix_fmt yuv420p \
  # abide to required 2s keyframe interval, this will set a value of 50 Group Of Pictures
  # value must be = frame rate * 2
  -g 50 \
  # minimum distance between I-frames and must be the same as -g value
  -keyint_min 50 \
  # Scene Change Threshold
  # option to make sure to not add any new keyframe when content of picture changes
  -sc_threshold 0 \
  # live stream to rtmp server
  -f flv rtmp://localhost:1935
```
