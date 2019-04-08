---
title: "Download DDG image file with go"
date: 2019-04-02T09:18:10+02:00
imageUrl: "https://pctechmag.com/wp-content/uploads/2014/09/DuckDuckGo_Logo_mid_2014.svg_.png"
tags: ["golang", "duckduckgo"]
categories: ["post"]
comment: true
toc: false
autoCollapseToc: false
contentCopyright: false
---

While DuckDuckGo offers [Instant Answer APIs](https://duckduckgo.com/api), it does not provide URLs to download images,
certainly because of copyright isusses.

One way is to fetch a `vqd` token from an initial basic request, then use it to find the image URLs, and finally download
the image.

<!--more-->

```golang
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "io/ioutil"
    "log"
    "os"
    "net/http"
    "regexp"
    "strings"
)

func main() {
    arg := os.Args[1]

    img := make(chan *ImgFetchResult)
	f := &DDGImgFetcher{}
	go f.Fetch(img, arg)
	result := <-img
	if result.Error != nil {
		log.Fatalln(result.Error)
	}
	createFile(result.Img, "/tmp/"+arg+"."+result.ContentType)
}

func createFile(content []byte, filePath string) {
	file, err := os.Create(filePath)
	if err != nil {
		log.Fatalln(err)
	}
	defer file.Close()

	_, err = io.Copy(file, bytes.NewReader(content))
	if err != nil {
		log.Fatalln(err)
	}
}

// DDGImgFetcher fetches the image from duckduckgo
type DDGImgFetcher struct {
}

// ImgFetchResult is the representation of the result to fetch the image
// It wraps an error in case something went wrong
type ImgFetchResult struct {
	Img         []byte
	ContentType string
	Error       error
}

const ddgURL = "https://duckduckgo.com"

// Fetch the image from duckduckgo
// Code inspired from https://github.com/deepanprabhu/duckduckgo-images-api/blob/master/duckduckgo_images_api/api.py
func (f *DDGImgFetcher) Fetch(result chan *ImgFetchResult, title string) {
	token, err := fetchToken(title)
	if err != nil {
		result <- &ImgFetchResult{nil, "", err}
		return
	}
	imgURL, err := fetchImgURL(title, token)
	if err != nil {
		result <- &ImgFetchResult{nil, "", err}
		return
	}
	img, contentType, err := downloadImg(imgURL)
	if err != nil {
		result <- &ImgFetchResult{nil, "", err}
		return
	}
	result <- &ImgFetchResult{img, contentType, nil}
}

// fetchToken needed to perform the image search
func fetchToken(title string) (string, error) {
	req, err := http.NewRequest("GET", ddgURL, nil)
	if err != nil {
		return "", fmt.Errorf("Could not build the request for URL %s. Error was %s", ddgURL, err)
	}
	q := req.URL.Query()
	q.Add("q", title)
	req.URL.RawQuery = q.Encode()
	resp, err := http.Get(req.URL.String())
	if err != nil {
		return "", fmt.Errorf("Could not fetch the result of %s", req.URL.String())
	}
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("Duckduckgo returns %v status code", resp.StatusCode)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("Could not read the response body from duckduckgo. Error was %s", err)
	}

	content := string(body)

	r := regexp.MustCompile("vqd=([\\d-]+)")
	token := strings.ReplaceAll(r.FindString(content), "vqd=", "")

	return token, nil
}

func fetchImgURL(title, token string) (string, error) {
	url := ddgURL + "/i.js"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("Could not build the request for URL %s. Error was %s", url, err)
	}
	q := req.URL.Query()
	q.Add("l", "wt-wt")
	q.Add("o", "json")
	q.Add("q", title)
	q.Add("vqd", token)
	q.Add("f", ",,,")
	q.Add("p", "2")
	req.URL.RawQuery = q.Encode()
	resp, err := http.Get(req.URL.String())
	if err != nil {
		return "", fmt.Errorf("Could not fetch the result of %s", req.URL.String())
	}
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("Duckduckgo returns %v status code", resp.StatusCode)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("Could not read the response body from duckduckgo. Error was %s", err)
	}
	var data map[string]interface{}
	err = json.Unmarshal(body, &data)
	if err != nil {
		return "", fmt.Errorf("Could not parse the response body from wikipedia. Error was %s", err.Error())
	}

	results := data["results"].([]interface{})
	firstResult := results[0].(map[string]interface{})
	imgURL := firstResult["image"].(string)
	return imgURL, nil
}

func downloadImg(imgURL string) ([]byte, string, error) {
	resp, err := http.Get(imgURL)
	if err != nil {
		return nil, "", fmt.Errorf("Could not download the image from %s", imgURL)
	}
	if resp.StatusCode != 200 {
		return nil, "", fmt.Errorf("Could not download the image from %s. Status comde was %v", imgURL, resp.StatusCode)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, "", fmt.Errorf("Could not read the response body from %s. Error was %s", imgURL, err.Error())
	}
	contentType := strings.ToLower(strings.ReplaceAll(resp.Header.Get("Content-Type"), "image/", ""))
	return body, contentType, nil
}
```

```bash
# Copy above content to main.go file
vim main.go
# Run with the following
go run main.go
```

Sources:

- Code in python: https://github.com/deepanprabhu/duckduckgo-images-api
