var margin = { top: 20, right: 20, bottom: 20, left: 20 };
width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    formatPercent = d3.format(".3%");

var svg = d3.select("#map").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

queue()
    .defer(d3.csv, "data_4_d3.csv")
    .defer(d3.json, "spain_map2.geojson")
    .await(ready);

var legendText = ["", "8%", "", "16%", "", "20%"];
var legendColors = ["#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02"];

function ready(error, miel_data, geo_data) {

    var nested = d3.nest()
        .key(function (d) {
            return d.Year;
        })
        .rollup(function (groups) {
            var total = d3.sum(groups, function (d) {

                return +d.TOTAL;

            })

            groups.forEach(function (d) {

                return d["shares"] = (+d.TOTAL / total) * 100;
            });

            return groups;

        })
        .entries(miel_data);

    var color = d3.scale.threshold()
        .domain([4, 8, 12, 16, 20])
        .range(["#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02"]);

    var center = d3.geo.centroid(geo_data)
    var projection = d3.geo.mercator()
        .center(center)
        .scale(2300)
        .translate([width / 2.0, height / 2.55]);

    var path = d3.geo.path().projection(projection);

    var map = svg.selectAll('.region')
        .data(geo_data.features)
        .enter()
        .append('path')
        .attr('class', "region")
        .attr('d', path)
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5);


    var legend = svg.append("g")
        .attr("id", "legend");

    var legenditem = legend.selectAll(".legenditem")
        .data(d3.range(6))
        .enter()
        .append("g")
        .attr("class", "legenditem")
        .attr("transform", function (d, i) { return "translate(" + i * 31 + ",1)"; });


    legenditem.append("rect")
        .attr("x", width - 200)
        .attr("y", -7)
        .attr("width", 30)
        .attr("height", 6)
        .attr("class", "rect")
        .style("fill", function (d, i) { return legendColors[i]; });

    legenditem.append("text")
        .attr("x", width - 200)
        .attr("y", -10)
        .style("text-anchor", "middle")
        .text(function (d, i) { return legendText[i]; });

    function update(year) {
        slider.property("value", year);
        d3.select(".year").text(year);

        var filtered = nested.filter(function (d) {
            return new Date(d['key']).getUTCFullYear() === +year;
        });

        map.style('fill', function (d) {
            var regName = d.properties.NAME_1;
            var f = [];
            filtered[0].values.forEach(function (m) {
                if (regName === m.Region) {

                    var val = m.shares;
                    f.push(color(+val));
                }

            });
            return f[0];

        });
        if (year === 2013) {
            var txts = svg.selectAll('.pertext')
                .data(filtered[0].values);


            txts.enter()
                .append('text').
                attr('class', 'pertext').
                transition()
                .duration(3000).text(function (d) {

                    var txt = (d.shares).toFixed(1);

                    return txt + "%";

                }).attr('x', function (d) { return projection([+d.lat, +d.long])[0] - 13; })
                .attr('y', function (d) { return projection([+d.lat, +d.long])[1]; });
        }
        else {
            var txts = svg.selectAll('.pertext')
                .data(filtered[0].values).text(function (d) {

                    var txt = (d.shares).toFixed(1);

                    return txt + "%";

                })
                .attr('x', function (d) { return projection([+d.lat, +d.long])[0] - 13; })
                .attr('y', function (d) { return projection([+d.lat, +d.long])[1]; });
        }
        map
            .on("mouseover", function (d) {

                tooltip.transition()
                    .duration(250)
                    .style("opacity", 1);
                tooltip.html(

                    "<p><strong>" + d.properties.NAME_1 + "</strong></p>"


                )
                    .style("left", (d3.event.pageX + 15) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(250)
                    .style("opacity", 0);
            });

    }

    var slider = d3.select(".slider")
        .append("input")
        .attr("type", "range")
        .attr("min", 2013)
        .attr("max", 2017)
        .attr("step", 1)
        .on("input", function () {
            var year = this.value;
            update(year);
        });

    update(2013);




}