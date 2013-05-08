import tangelo
import pymongo
import bson.json_util
import datetime

def unix_time(dt):
    epoch = datetime.datetime.utcfromtimestamp(0)
    delta = dt - epoch
    return delta.total_seconds()*1000

def run(details=None):
	conn = pymongo.Connection("mongo")
	coll = conn["canepi"]["alerts"]
	if details:
		for d in coll.find(fields = ["summary"]).limit(1).skip(int(details)):
			return d["summary"]
	query = coll.find(fields = ["date", "rating.rating", "disease", "country"])
	data = [[unix_time(d["date"]), d["rating"]["rating"], d["disease"], d["country"]] for d in query if d["date"] != None]
	return bson.json_util.dumps(data, indent = 4)