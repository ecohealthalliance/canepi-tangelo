var nodes,
    links,
    force,
    width,
    height,
    color,
    transition_time;

var timeout = null;
function toggleAnimation() {
    anim = d3.select("#animate");
    update = d3.select("#update");

    if (anim.text() === "Animate") {
        anim.text("Stop animation")
            .classed("btn-success", false)
            .classed("btn-warning", true);
        update.attr("disabled", true);

        timeout = setInterval(function () {
            var value;

            value = $("#date").slider("value") + 86400e3;
            $("#date").slider("value", value);

            updateGraph();
        }, transition_time * 1.5);
    } else {
        anim.text("Animate")
            .classed("btn-success", true)
            .classed("brn-warning", false);
        update.attr("disabled", null);

        clearInterval(timeout);
    }
}

function updateGraph() {
    "use strict";

    var update,
        change_button,
        start_date,
        end_date,
        data,
        map;

    update = d3.select("#update");
    change_button = !update.attr("disabled");

    if (change_button) {
        update.attr("disabled", true)
            .text("Updating...");
    }

    start_date = new Date($("#date").slider("value"));
    end_date = new Date(start_date.getTime() + $("#range").slider("value") * 86400 * 1000);

    data = {
        start_date: start_date.getFullYear() + "-" + (start_date.getMonth() + 1) + "-" + start_date.getDate(),
        end_date: end_date.getFullYear() + "-" + (end_date.getMonth() + 1) + "-" + end_date.getDate()
    };

    $.ajax({
        url: "service/canepi-network",
        data: data,
        dataType: "json",
        success: function (resp) {
            var tau,
                graph,
                link,
                node,
                enter,
                newidx,
                angle;

            if (change_button) {
                d3.select("#update")
                    .attr("disabled", null)
                    .text("Update");
            }

            if (resp.error !== null) {
                console.log("error: " + resp.error);
                return;
            }

            map = {};
            $.each(force.nodes(), function (i, v) {
                map[v.id] = v;
            });

            graph = resp.result;
            newidx = [];
            $.each(graph.nodes, function (i, v) {
                if (map.hasOwnProperty(v.id)) {
                    graph.nodes[i].x = map[v.id].x;
                    graph.nodes[i].y = map[v.id].y;
                } else {
                    newidx.push(i);
                }
            });

            tau = 2 * Math.PI;
            angle = tau / newidx.length;
            $.each(newidx, function (i, v) {
                graph.nodes[i].x = (width/2) * Math.cos(i * angle) + (width/2);
                graph.nodes[i].y = (height/2) * Math.sin(i * angle) + (height/2);
            });

            force.nodes(graph.nodes)
                .links(graph.links)
                .start()
                .alpha(0.02);

            link = d3.select("g#links")
                .selectAll(".link")
                .data(graph.links, function (d) {
                    return d.source.id + d.target.id;
                });

            link.enter().append("line")
                .classed("link", true)
                .style("opacity", 0.0)
                .style("stroke-width", 0.0)
                .transition()
                .duration(transition_time)
                .style("opacity", 1.0)
                .style("stroke-width", 1.0);

            link.exit()
                .transition()
                .duration(transition_time)
                .style("opacity", 0.0)
                .style("stroke-width", 0.0)
                .remove();

            node = d3.select("g#nodes")
                .selectAll("g")
                .data(graph.nodes, function (d) {
                    return d.id;
                });

            enter = node.enter().append("g");

            enter.filter(function (d) {
                    return d.type === "alert";
                })
                .append("circle")
                .classed("node", true)
                .attr("r", 5)
                .style("opacity", 0.0)
                .style("fill", function (d) {
                    return color(d.type);
                })
                .transition()
                .duration(transition_time)
                .style("opacity", 1.0);
            enter.filter(function (d) {
                    return d.type === "alert";
                })
                .append("title")
                .text(function (d) {
                    return tangelo.date.displayDate(new Date(d.date.$date));
                });

            enter.filter(function (d) {
                    return d.type !== "alert";
                })
                .append("text")
                .text(function (d) {
                    return d.id;
                })
                .datum(function (d) {
                    d.bbox = this.getBBox();
                })
                .attr("x", function (d) { return -0.5 * this.getBBox().width; })
                .style("opacity", 0.0)
                .transition()
                .duration(transition_time)
                .style("opacity", 1.0);

            enter.filter(function (d) {
                    return d.type !== "alert";
                })
                .insert("rect", ":first-child")
                .attr("width", function (d) { return d.bbox.width; })
                .attr("height", function (d) { return d.bbox.height; })
                .attr("y", function (d) { return -0.75*d.bbox.height; })
                .attr("x", function (d) { return -0.5*d.bbox.width; })
                .style("stroke", function (d) { return color(d.type); })
                .style("stroke-width", "2px")
                .style("fill", "#e5e5e5")
                .style("opacity", 0.0)
                .transition()
                .duration(transition_time)
                .style("opacity", 1.0);

            node.call(force.drag);

            node.exit()
                .transition()
                .duration(transition_time)
                .style("opacity", 0.0)
                .attr("r", 0.0)
                .style("fill", "black")
                .remove();

            force.on("tick", function () {
                link.attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });

                    node.attr("transform", function (d) {
                        return "translate(" + d.x + ", " + d.y + ")";
                    });
            });
        }
    });
}

window.onload = function () {
    "use strict";

    var date_display,
        range_display;

    width = $(window).width();
    height = $(window).height();
    force = d3.layout.force()
        .charge(-500)
        .linkDistance(100)
        .gravity(0.2)
        .friction(0.6)
        .size([width, height]);
    color = d3.scale.category20();

    date_display = function (evt, ui) {
        d3.select("#date-label")
            .text(tangelo.date.displayDate(new Date(ui.value)));
    };

    range_display = function (evt, ui) {
        d3.select("#range-label")
            .text(ui.value + " day" + (ui.value !== 1 ? "s" : ""));
    };

    $("#date").slider({
        min: new Date("October 28, 2012").getTime(),
        max: new Date("April 25, 2013").getTime(),
        step: 86400e3,
        slide: date_display,
        change: date_display
    });
    $("#date").slider("value", $("#date").slider("value"));

    $("#range").slider({
        min: 1,
        max: 42,
        step: 1,
        slide: range_display,
        change: range_display
    });
    $("#range").slider("value", $("#range").slider("value"));

    d3.select("#update")
        .on("click", updateGraph);

    d3.select("#animate")
        .on("click", toggleAnimation);

    d3.json("service/canepi", function (e, json) {
        var countries,
            diseases,
            filter,
            set,
            spans;

        filter = function (i) {
            var set = {};

            return function (d) {
                var retval;

                if (d[i] === null) {
                    return false;
                }

                retval = !set[d[i]];
                if (!set.hasOwnProperty(d[i])) {
                    set[d[i]] = true;
                }
                return retval;
            };
        };

        countries = json.filter(filter(3)).map(function (d) { return d[3]; }).sort();
        diseases = json.filter(filter(2)).map(function (d) { return d[2]; }).sort();

        d3.select("#countries")
            .selectAll("label")
            .data(countries)
            .enter()
            .append("label")
                .classed("checkbox", true)
                .text(function (d) {
                    return d;
                })
            .append("input")
                .attr("type", "checkbox")
                .attr("id", function (d) {
                    return "country:" + d.replace(/ /g, "-");
                })
                .attr("checked" , true);

        d3.select("#diseases")
            .selectAll("label")
            .data(diseases)
            .enter()
            .append("label")
                .classed("checkbox", true)
                .text(function (d) {
                    return d;
                })
            .append("input")
                .attr("type", "checkbox")
                .attr("id", function (d) {
                    return "disease:" + d.replace(/ /g, "-");
                })
                .attr("checked", true);
    });

    transition_time = 2000;

    updateGraph();
}
