var pcpChart = function () {
    let margin = {
        top: 20,
        right: 10,
        bottom: 20,
        left: 10
    };
    let width = 800 - margin.left - margin.right;
    let height = 300 - margin.top - margin.bottom;
    let titleText;
    let selectedLineOpacity = 0.15;
    let unselectedLineOpacity = 0.05;
    let showSelected = true;
    let showUnselected = true;
    // let divTop = 0;

    let chartData;
    let svg;
    let foreground;
    let background;
    let selected;
    let unselected;
    let dimensions;
    let x;
    let y;

    function chart(selection, data) {
        chartData = data;
        selected = chartData;

        x = d3.scalePoint().range([0, width]).padding(.25);
        y = {};
        
        const axis = d3.axisLeft();

        const backgroundCanvas = selection.append('canvas')
            .attr('id', 'background')
            .attr('width', width+1)
            .attr('height', height+1)
            .style('position', 'absolute')
            .style('top', `${margin.top }px`)
            .style('left', `${margin.left}px`)
        background = backgroundCanvas.node().getContext('2d');
        background.strokeStyle = "rgba(80,80,80)";
        background.globalAlpha = unselectedLineOpacity;

        const foregroundCanvas = selection.append('canvas')
            .attr('id', 'foreground')
            .attr('width', width+1)
            .attr('height', height+1)
            .style('position', 'absolute')
            .style('top', `${margin.top}px`)
            .style('left', `${margin.left}px`)
        foreground = foregroundCanvas.node().getContext('2d');
        foreground.strokeStyle = "rgba(0,100,160)";
        foreground.globalAlpha = selectedLineOpacity;
        foreground.antialias = true;

        svg = selection.append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .style('position', 'absolute')
            .append('svg:g')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');
        
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -24)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "14")
            .text(titleText);
        
        svg.append("text")
            .attr("class", "selection_label")
            .attr("x", width - 2)
            .attr("y", height + 20)
            .style("text-anchor", "end")
            .style("font-size", "12")
            .text(`0/${chartData.length} Lines Selected`);

        svg.append("line")
            .attr("x1", 0)
            .attr("y1", height + 8)
            .attr("x2", width)
            .attr("y2", height + 8)
            .style("stroke", "lightgray")
            .style("stroke-width", "2")
            .style("stroke-linecap", "round");
            // .style("stroke-width", "2");

        svg.append("line")
            .attr("class", "selection_line")
            .attr("x1", 0)
            .attr("y1", height + 8)
            .attr("x2", width)
            .attr("y2", height + 8)
            .style("stroke", "rgba(0,100,160)")
            .style("stroke-width", "4")
            .style("stroke-linecap", "round");

        let dimensionNames = [];
        dimensions.forEach((dimension) => {
            dimensionNames.push(dimension.name);
            if (dimension.type === 'numerical') {
                y[dimension.name] = d3.scaleLinear()
                    .domain(d3.extent(chartData, (d) => { 
                        return d[dimension.name]; 
                    }));
            } else if (dimension.type === 'categorical') {
                const domain = [...new Set(chartData.map(d => d[dimension.name]))].sort(d3.descending);
                y[dimension.name] = d3.scaleBand()
                    .domain(domain);
            }
            y[dimension.name].range([height, 0]);
        });
        x.domain(dimensionNames);
        // console.log(y);

        dimensions.forEach((dim) => {
            if (dim.type === 'categorical') {
                dim.bins = [0, 0];
                chartData.forEach((d) => {
                    dim.bins[d[dim.name]]++;
                })
                dim.selected = new Set();
                // let histogram = d3.histogram()
                //     .value(d => d[dim.name])
                //     .domain([0, 1])
                //     .thresholds(2);
                // let bins = histogram(chartData);
                // // let bin = d3.bin().value(d => d[dim.name]);
                // // let buckets = bin(chartData);
                // // .value(d => d[dim.name]).domain([0, 1]).thresholds(2);
                // dim.bins = bins;
            }
        })
        console.log(dimensions);
        
        // dimensionType = new Map();
        // x.domain(dimensions = d3.keys(chartData[0]).filter(function (d) {
        //     if (chartData[0][d] instanceof Date) {
        //     // if (d === 'date') {
        //         dimensionType.set(d, 'date');
        //         return y[d] = d3.scaleTime()
        //             .domain(d3.extent(chartData, function (p) {
        //                 return p[d];
        //             }))
        //             .range([height, 0]);
        //             // .nice()
        //     } else if (typeof chartData[0][d] === 'string') {
        //         dimensionType.set(d, 'string');
        //         let domain = [...new Set(chartData.map(v => v[d]))].sort(d3.descending);
        //         return y[d] = d3.scaleBand()
        //             .domain(domain)
        //             .range([height, 0]);
        //         // return y[d] = d3.scaleOrdinal()
        //         //     .domain(domain)
        //         //     .range([height, 0]);
        //     } else {
        //         dimensionType.set(d, 'linear');
        //         return y[d] = d3.scaleLinear()
        //             .domain(d3.extent(chartData, function (p) {
        //                 return p[d];
        //             }))
        //             .range([height, 0]);
        //             // .nice();
        //     }
        // }));

        chartData.map(function (d) {
            if (showSelected) {
                path(d, foreground);
            }
        });

        // Add a group element for each dimension.
        const g = svg.selectAll(".dimension")
                .data(dimensions)
            .enter().append("g")
                .attr("class", "dimension")
                .attr("transform", function (d) {
                    return "translate(" + x(d.name) + ")";
                });

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                if (d.type === 'numerical') {
                    d3.select(this).call(axis.scale(y[d.name]));
                } else if (d.type === 'categorical') {
                    d3.select(this).append("line")
                        .attr("x0", 0)
                        .attr("y0", 0)
                        .attr("x1", 0)
                        .attr("y1", height)
                        .style("stroke", "darkgray")
                        .style("stroke-width", "3")
                        .style("stroke-linecap", "round");
                    for (index in d.bins) {
                        const value = index;
                        let catRect = d3.select(this).append("rect")
                            .attr("x", -3)
                            .attr("y", y[d.name](index) + 3)
                            .attr("width", 6)
                            .attr("height", y[d.name].bandwidth() - 6)
                            .attr("rx", 2)
                            .attr("ry", 2)
                            .attr("fill", "ghostwhite")
                            // .attr("fill-opacity", 0.6)
                            .attr("stroke", "gray")
                            .on("click", function(d) {
                                // console.log("clicked");
                                console.log(value);
                                if (d.selected.has(+value)) {
                                    d.selected.delete(+value);
                                    catRect.attr("fill", "ghostwhite");
                                } else {
                                    d.selected.add(+value);
                                    catRect.attr("fill", "orange");
                                }
                                brush();
                            });
                        d3.select(this).append("text")
                            .style("text-anchor", "middle")
                            .style("font-size", 10)
                            .style("font-family", "sans-serif")
                            .attr("y", y[d.name](index) + y[d.name].bandwidth()/2.)
                            .attr("x", 0)
                            .text(index);
                    }
                    // d.bins.forEach((bin) => {
                    //     d3.select(this).append("rect")
                    //         .attr("x", -2)
                    //         .attr("y", y[d.name](bin))
                    // })
                    // d3.select(this).append("rect")
                    //     .attr("x", -2)
                    //     .attr("y", 0)
                    //     .attr("width", 4)
                    //     .attr("height", height);
                }
            })
            .append("text")
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-family", "sans-serif")
            .style("font-size", 10)
            .attr("y", -9)
            .text(function (d) {
                return d.name;
            });

        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function (d) {
                if (d.type === 'numerical') {
                    d3.select(this).call(y[d.name].brush = d3.brushY()
                        .extent([
                            [-10, 0],
                            [10, height]
                        ])
                        .on("brush", brush)
                        .on("end", brush)
                    )
                }
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        let actives = [];
        svg.selectAll(".brush")
            .filter(function (d) {
                y[d.name].brushSelectionValue = d3.brushSelection(this);
                return d3.brushSelection(this);
            })
            .each(function (d) {
                // Get extents of brush along each active selection axis (the Y axes)
                let brushExtent = d3.brushSelection(this);
                
                if (d.type === 'categorical') {
                    let selected = y[d.name].domain().filter(function (value) {
                        let pos = y[d.name](value) + y[d.name].bandwidth() / 2;
                        return pos > brushExtent[0] && pos < brushExtent[1];
                        // return brushExtent[0] <= y[d](value) && brushExtent[1] >= y[d](value);
                    });
                    actives.push({
                        dimension: d,
                        extent: selected,
                    });
                } else {
                    actives.push({
                        dimension: d,
                        extent: d3.brushSelection(this).map(y[d.name].invert)
                    });
                }
            });
        
        dimensions.forEach((dim) => {
            if (dim.type === 'categorical') {
                if (dim.selected.size > 0) {
                    actives.push({
                        dimension: dim,
                        extent: [...dim.selected],
                    })
                }
            }
        });
        console.log(actives);

        selectLines(actives);
        // selected = [];
        // unselected = [];
        // chartData.map(function (d) {
        //     return actives.every(function (p, i) {
        //         if (p.dimension.type === 'categorical') {
        //         // if (dimensionType.get(p.dimension) === 'string') {
        //             return p.extent.indexOf(d[p.dimension.name]) >= 0;
        //         } else {
        //             return d[p.dimension.name] <= p.extent[0] && d[p.dimension.name] >= p.extent[1];
        //         }
        //     }) ? selected.push(d) : unselected.push(d);
        // });

        drawLines();
        // foreground.clearRect(0, 0, width + 1, height + 1);
        // selected.map(function (d) {
        //     path(d, foreground);
        // });

        // background.clearRect(0, 0, width + 1, height + 1);
        // unselected.map(function (d) {
        //     path(d, background);
        // });
    }

    function path(d, ctx) {
        ctx.beginPath();
        dimensions.map(function (dim, i) {
            if (i == 0) {
                if (dim.type === 'categorical') {
                    let randomY = Math.random() * (y[dim.name].bandwidth()/4) - (y[dim.name].bandwidth() / 8);
                    ctx.moveTo(x(dim.name), y[dim.name](d[dim.name]) + (y[dim.name].bandwidth()/2) + randomY);
                } else {
                    ctx.moveTo(x(dim.name), y[dim.name](d[dim.name]));
                }
            } else {
                if (dim.type === 'categorical') {
                    let randomY = Math.random() * (y[dim.name].bandwidth()/4) - (y[dim.name].bandwidth() / 8);
                    ctx.lineTo(x(dim.name), y[dim.name](d[dim.name]) + (y[dim.name].bandwidth()/2) + randomY);
                } else {
                    ctx.lineTo(x(dim.name), y[dim.name](d[dim.name]));
                }
            }
        });
        ctx.stroke();
    };

    function selectLines(actives) {
        selected = [];
        unselected = [];
        chartData.map(function (d) {
            return actives.every(function (p, i) {
                if (p.dimension.type === 'categorical') {
                // if (dimensionType.get(p.dimension) === 'string') {
                    return p.extent.indexOf(d[p.dimension.name]) >= 0;
                } else {
                    return d[p.dimension.name] <= p.extent[0] && d[p.dimension.name] >= p.extent[1];
                }
            }) ? selected.push(d) : unselected.push(d);
        });
    }

    function drawLines() {
        drawBackgroundLines();
        drawForegroundLines();

        const percentSelected = ((selected.length / chartData.length) * 100.).toFixed(1);
        d3.select(".selection_label")
            .text(`${selected.length} / ${chartData.length} (${percentSelected}%) Lines Selected`);
        let selectionLineWidth = width * (selected.length / chartData.length);
        d3.select(".selection_line")
            .transition().duration(200).delay(100)
            .attr("x2", selectionLineWidth);
    }

    function drawForegroundLines() {
        foreground.clearRect(0, 0, width + 1, height + 1);
        if (showSelected) {
            selected.map(function (d) {
                path(d, foreground);
            });
        }
    }

    function drawBackgroundLines() {
        background.clearRect(0, 0, width + 1, height + 1);
        if (showUnselected) {
            unselected.map(function (d) {
                path(d, background);
            });
        }
    }

    chart.dimensions = function (value) {
        if (!arguments.length) {
            return dimensions;
        }
        dimensions = value;
        return chart;
    }

    chart.width = function (value) {
        if (!arguments.length) {
            return width;
        }
        width = value - margin.left - margin.right;
        return chart;
    }

    chart.height = function (value) {
        if (!arguments.length) {
            return height;
        }
        height = value - margin.top - margin.bottom;
        return chart;
    }

    chart.titleText = function (value) {
        if (!arguments.length) {
            return titleText;
        }
        titleText = value;
        return chart;
    }

    chart.showSelectedLines = function (value) {
        if (!arguments.length) {
            return showSelected;
        }
        showSelected = value;
        if (foreground) {
            drawLines();
        }
        return chart;
    }

    chart.showUnselectedLines = function (value) {
        if (!arguments.length) {
            return showUnselected;
        }
        showUnselected = value;
        if (background) {
            drawLines();
        }
        return chart;
    }

    chart.selectedLineOpacity = function (value) {
        if (!arguments.length) {
            return selectedLineOpacity;
        }
        selectedLineOpacity = value;
        if (foreground) {
            foreground.globalAlpha = selectedLineOpacity;
            drawForegroundLines();
        }
        return chart;
    }

    chart.unselectedLineOpacity = function (value) {
        if (!arguments.length) {
            return unselectedLineOpacity;
        }
        unselectedLineOpacity = value;
        if (background) {
            background.globalAlpha = unselectedLineOpacity;
            drawBackgroundLines();
        }
        return chart;
    }

    chart.margin = function (value) {
        if (!arguments.length) {
          return margin;
        }
        oldChartWidth = width + margin.left + margin.right
        oldChartHeight = height + margin.top + margin.bottom
        margin = value;
        width = oldChartWidth - margin.left - margin.right
        height = oldChartHeight - margin.top - margin.bottom
        // resizeChart();
        return chart;
    }

    return chart;
}