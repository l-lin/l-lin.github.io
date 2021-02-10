---
title: "About me"
date: 2017-08-20T21:38:52+08:00
comment: false
---

{{< figure class="center" src="/images/hi.png" alt="Hello" >}}

My name is Louis Lin: I'm a senior software engineer, I love reading light and web novels and
watching the famous Korean variety show "Running man".

This is my digital garden, dedicated to storing some tips and tricks, thoughts, ideas and all other
stuffs I think I want to preserve somewhere in the web.

Here's my [stackoverflow story view](https://stackoverflow.com/story/l-lin).

# Overview of my side projects in Github

## 2020

![golang][] [Trello daily logs](https://github.com/l-lin/trello-daily-logs)

I want to track what I did during the day, and as I'm using Trello to manage my daily tasks, I can
use the [Trello APIs](https://developers.trello.com/docs/api-introduction) to fetch the card
information, especially the ones from my DONE list. Thus, I developed a simple command line tool to
fetch the data from Trello, then write the content in markdown format in a file. Finally, I added a
cron that executes the command at the end of the day.

## 2019

![golang][] [OWASP risk rating Asciidoctor table generator](https://github.com/l-lin/risk-rating)

I wrote a threat model for an application and the [OWASP has a methodology to rate the
risk](https://owasp.org/www-project-risk-assessment-framework/). So I developed a simple command
line tool to generate the OWASP risk rating in [Asciidoctor](https://asciidoctor.org/), the text
format used when I wrote the document.

## 2018

![kotlin][] [Ktodo](https://github.com/l-lin/ktodo)

I heard a lot about Kotlin, and since my primary programing language was Java, I thought "why not
Kotlin?". Same as Gotodo, I created a simple command line todo written in Kotlin.

## 2017

![golang][] [Gotodo](https://github.com/l-lin/gotodo)

I already learned Golang, but as I did not use it frequently, I kink of forgot how to develop with
it. So I created a simple command line todo written in Golang to keep up to shape.

## 2015

![chrome][] [Manga reader tracker chrome extension](https://github.com/l-lin/mr-tracker-chrome)
![golang][] [Manga reader tracker API](https://github.com/l-lin/mr-tracker-api)

My sister likes reading mangas and so do I. In order to keep track of what we are reading, I
developed a chrome extension and a service in Golang deployed in Heroku. This was good at first, but
we ended up not using it as it was becoming more like a chore than helping us...

![chrome][] [Web novels tracker chrome extention](https://github.com/l-lin/wn-tracker-chrome)
![golang][] [Web novels tracker API](https://github.com/l-lin/wn-tracker-api)

I like reading web novels and I started learning to create chrome extension and using Golang. Thus, I
thought of creating something to track what I read. This was a good experience, using Google store
and learning Google new programing language (which I ended loving it).

However, it was not practical (only usable on Chrome based browsers) and I discovered the website
[Novelupdates](https://www.novelupdates.com/) to track web novels, which is way better than my
extension.

## 2014

2014 was the year were the front started going hyped and crazy by releasing new front libraries /
frameworks every two weeks or so. In order to be kept up to date, I had to learn some basic stuffs,
and what's better than creating some side projects using those new shiny stuffs?

![css3][] [Font awesome animation](https://github.com/l-lin/font-awesome-animation)

2014 was also the year when CSS3 were starting to be adopted. As I found some cool animations in
multiple websites, I thought of centralizing them in a single repository using just CSS3.

![meteorjs][] [What lunch today?](https://github.com/l-lin/whatlunchtoday)

This was the period where JS frameworks were born every two weeks. MeteorJS was one of them. Every
noon, we did not know where to go to eat lunch. So the purpose of this web application was to help
us decide where to go with a simple voting system. Unfortunately, although the thought was here, the
system itself did not work well, and we ended up not using it.

![datatables][] [Angular DataTables](https://github.com/l-lin/angular-datatables)

As I was developing a web application in AngularJS, I needed to have advanced tables displayed
in the application. As I was developing the library, I thought it was cool to share it with the
internet, thus angular-datatables was born. However, this open source project was the most time-consuming
and the most frustrating...

![openbadge][] [Open badge card](https://github.com/l-lin/openbadges-card)

Mozilla had a [Mozilla backpack](https://backpack.openbadges.org/) used to communicate skills and
achievements by providing visual representations of the accomplishments. This project is simple
embeddable card showing the Open badges in an `iframe` to be put in any website to show off your
accomplishments. Unfortunately, Mozilla backpack has now moved to [Badgr](https://badgr.org/) makes
this project useless.

![jquery][] [Back to top](https://github.com/l-lin/backtotop)

I was creating this very website (before I finally used [Hugo](https://gohugo.io/)), I lacked a
simple button to get back to the top of the page. Thus, I created this simple Javascript library.

![angularjs][] [Bulletular](https://github.com/l-lin/bulletular)

This project is also one project used to learn AngularJS. It was heavily inspired by
[Workflowy](https://www.workflowy.com/). It's a note taking web application that stores all the
data client side. This project helps me understand how to interact with the keyboard and
AngularJS.

![angularjs][] [Angular notifier](https://github.com/l-lin/angular-notifier)

When AngularJS first came out in 2014, I tried to learn it by creating multiple libraries.
Angular notifier is one of them. It's a simple AngularJS notification service that displays a
simple popup on the web page.

[angularjs]: /images/angularjs_icon.png
[chrome]: /images/chrome_icon.png
[css3]: /images/css3_icon.png
[datatables]: /images/datatables_icon.png
[golang]: /images/golang_icon.png
[jquery]: /images/jquery_icon.png
[kotlin]: /images/kotlin_icon.png
[meteorjs]: /images/meteorjs_icon.png
[openbadge]: /images/openbadge_icon.png

