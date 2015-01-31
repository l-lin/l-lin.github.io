---
layout: post
title:  "Deploying a Golang web apps to Heroku"
date:   2015-01-31
tags: [Heroku, MeteorJS]
images: [heroku.png, golang.png]
---

Deploying a [Golang](https://golang.org/) web apps to [Heroku](https://www.heroku.com) is quite easy.

Heroku configuration
====================

Heroku configurations are fetched from the OS environment variables.

So to fetch the webapp port, you will need to call `os.Getenv("PORT")`.

```go
package main

import (
    "net/http"
	"os"
	"log"
    "fmt"
)

func main() {
	port := GetPort()
	log.Println("[-] Listening on...", port)
    http.HandleFunc("/", func (res http.ResponseWriter, req *http.Request) {
        fmt.Fprintln(res, "hello, world")
    })

    err := http.ListenAndServe(":"+os.Getenv("PORT"), nil)
    if err != nil {
      panic(err)
    }
}

func GetPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "4747"
		log.Println("[-] No PORT environment variable detected. Setting to ", port)
	}
	return ":" + port
}
```

That's everything you need to do in your Golang webapp.

Now, you will need to tell Heroku to add the following buildpack to your webapps:

```bash
$ cd /path/to/golang/app
$ heroku config:add BUILDPACK_URL=https://github.com/kr/heroku-buildpack-go.git
$ git push heroku master
```

Now, you are good to go!

Adding a Database to your Web app
=================================

Heroku really has made the life of developper really easier. To add a new database to your webapp, it's really easy.
For example, I needed to add a Postgresql. I just needed to execute one command line and the configuration is fetched from the environment variables:

```bash
$ heroku addons:add heroku-postgresql:dev
```

More information on [Heroku's documentation](https://www.heroku.com/postgres).

Now to connect to the database, you will need:
* to get the [Postgresql driver](github.com/lib/pq)
* fetch Heroku's DB configuration from the **DATABASE_URL** environment variable

```go
package main

import (
	_ "github.com/lib/pq"
	"log"
    "database/sql"
	"os"
)

// Fetch the list of novels
func GetList() []*Novel {
	novels := make([]*Novel, 0)
	database := connect()
	defer database.Close()

	rows, err := database.Query("SELECT id, title, url, image_url, summary, favorite FROM novels")
	if err != nil {
		log.Fatalf("[x] Error when getting the list of novels. Reason: %s", err.Error())
	}
	for rows.Next() {
		n := toNovel(rows)
		if n.IsValid() {
			novels = append(novels, n)
		}
	}
	if err := rows.Err(); err != nil {
		log.Fatalf("[x] Error when getting the list of novels. Reason: %s", err.Error())
	}
	return novels
}

// Connect to Heroku database using the OS env DATABASE_URL
func connect() *sql.DB {
	dbUrl := os.Getenv("DATABASE_URL")
	database, err := sql.Open("postgres", dbUrl)
	if err != nil {
		log.Fatalf("[x] Could not open the connection to the database. Reason: %s", err.Error())
	}
	return database
}

// Fetch the content of the rows and build a new novel
func toNovel(rows db.RowMapper) *Novel {
	var id string
	var title string
	var url string
	var imageUrl string
	var summary string
	var favorite bool

	rows.Scan(&id, &title, &url, &imageUrl, &summary, &favorite)

	return &Novel{
		Id: id,
		Title: title,
		Url: url,
		ImageUrl: imageUrl,
		Summary: summary,
		Favorite: favorite,
	}
}
```
