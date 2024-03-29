import datetime
import tangelo
import pymongo
import bson.json_util

def run(start_date=None, end_date=None, omit_countries=None, omit_diseases=None):
    # Check for required arguments.
    if start_date is None:
        return tangelo.HTTPStatusCode("422 Missing Parameter", "Required parameter <i>start_date</i> missing.");
    elif end_date is None:
        return tangelo.HTTPStatusCode("422 Missing Parameter", "Required parameter <i>end_date</i> missing.");

    # Convert arguments to date objects.
    try:
        start_date = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    except ValueError:
        return tangelo.HTTPStatusCode("422 Bad Parameter", "Parameter <i>start_date</i> ('%s') was not in YYYY-MM-DD form." % (start_date))

    try:
        end_date = datetime.datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        return tangelo.HTTPStatusCode("422 Bad Parameter", "Parameter <i>end_date</i> ('%s') was not in YYYY-MM-DD form." % (end_date))

    # See if there are any countries or diseases to omit.
    if omit_countries is None:
        omit_countries = []
    else:
        try:
            omit_countries = bson.json_util.loads(omit_countries)
        except ValueError:
            return tangelo.HTTPStatusCode("422 Bad Parameter", "Parameter <i>omit_countries</i> ('%s') was not JSON-deserializable." % (omit_countries))

    if omit_diseases is None:
        omit_diseases = []
    else:
        try:
            omit_diseases = bson.json_util.loads(omit_diseases)
        except ValueError:
            return tangelo.HTTPStatusCode("422 Bad Parameter", "Parameter <i>omit_diseases</i> ('%s') was not JSON-deserializable." % (omit_diseases))

    # Perform the lookup.
    coll = pymongo.Connection("mongo").canepi.alerts
    query = coll.find({"$and": [{"date": {"$gte": start_date} },
                                {"date": {"$lt": end_date} },
                                {"disease": {"$not": {"$in": omit_diseases}}},
                                {"country": {"$not": {"$in": omit_countries}}}]
                      },
                      fields = ["_id", "date", "rating.rating", "disease", "country"])

    # Compute the graph structure.
    nodes = []
    links = []

    diseases = {}
    countries = {}

    for q in query:
        # For each result record, construct an "alert type" node and store it in
        # the node list.
        alert = {"id": str(q["_id"]), "date": q["date"], "rating": q["rating"]["rating"], "type": "alert"}
        nodes.append(alert)

        # Extract the disease and country, and create nodes for them if they
        # don't already exist.
        if q["country"] not in countries:
            countries[q["country"]] = {"id": q["country"], "type": "country"}
        country = countries[q["country"]]

        if q["disease"] not in diseases:
            diseases[q["disease"]] = {"id": q["disease"], "type": "disease"}
        disease = diseases[q["disease"]]

        # Create links between the alert and its country and its disease.
        links += [{"source": alert, "target": country}, {"source": alert, "target": disease}]

    # Add the disease and country nodes to the node list.
    nodes += countries.values() + diseases.values()

    # Create an index map of the nodes.
    nodemap = {value["id"]: index for (index, value) in enumerate(nodes)}

    # Replace the raw entries in the links list with indices into the node
    # array.
    for i, v in enumerate(links):
        links[i]["source"] = nodemap[v["source"]["id"]]
        links[i]["target"] = nodemap[v["target"]["id"]]

    # Create a response object and pack the graph structure into it.
    r = tangelo.empty_response()
    r["result"] = {"nodes": nodes, "links": links}
    
    # Use the special bson encoder and return the result.
    return bson.json_util.dumps(r)
