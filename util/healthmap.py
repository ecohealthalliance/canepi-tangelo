import datetime
import urllib2
import json
import pymongo

# Establish a connection to the MongoDB server.
try:
    conn = pymongo.Connection("mongo")
except pymongo.errors.AutoReconnect as e:
    print "error: %s" % (e.message)

# Extract the requested database and collection.
collection = conn["canepi"]["alerts"]

key = "4976edc8a1ce3d17c06f90ec7fd8b39f"
url = "http://healthmap.org/HMapi.php?auth=%s&striphtml=1" % key
date = datetime.date(2012, 10, 28)
today = datetime.date.today()
day = datetime.timedelta(days=1)
while date < today:
    datestr = date.isoformat()
    nextdatestr = (date + day).isoformat()
    dateurl = url + ("&sdate=%s&edate=%s" % (datestr, nextdatestr))
    alerts = json.load(urllib2.urlopen(dateurl))
    num = 0
    print datestr
    for loc in alerts:
        for alert in loc["alerts"]:
            alert["rating"]["count"] = int(alert["rating"]["count"])
            alert["rating"]["rating"] = float(alert["rating"]["rating"])
            alert["location"] = [float(loc["lng"]), float(loc["lat"])]
            alert["country"] = loc["country"]
            alert["place_name"] = loc["place_name"]
            alert["date"] = datetime.datetime.strptime(alert["date"], "%Y-%m-%d %H:%M:%S")
            collection.save(alert)
            num = num + 1
    print num
    date = date + day

