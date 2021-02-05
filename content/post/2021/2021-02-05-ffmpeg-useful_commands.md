---
title: "FFmpeg - useful commands"
date: 2021-02-05T10:56:06+01:00
imageUrl: ""
tags: ["ffmpeg"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
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
```
