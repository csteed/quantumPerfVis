var pcpChart = function () {
    let margin = { top: 20, right: 10, bottom: 20, left: 10 };
    let width = 800 - margin.left - margin.right;
    let height = 300 - margin.top - margin.bottom;

    let chartData = null;

    function chart(selection, data) {
        const chartID = selection.attr('id');
        chartData = data;

        const svg = selection.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        svg_adjusted = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        const x = d3.scalePoint().range([0, width]).padding(1);
        const y = {};
        
        let line = d3.line();
        let axis = d3.axisLeft();
        let background;
        let foreground;
        let dimensions = null;

        x.domain(dimensions = d3.keys(chartData[0]).filter(function(d) {
            if (d === 'date') {
                return y[d] = d3.scaleTime()
                    .domain(d3.extent(chartData, function(p) { return p[d]; }))
                    .range([height, 0])
                    .nice()
            } else {
                return y[d] = d3.scaleLinear()
                    .domain(d3.extent(chartData, function(p) { return p[d]; }))
                    .range([height, 0])
                    .nice();
            }
            // return d != "name" && (y[d] = d3.scaleLinear()
            //     .domain(d3.extent(chartData, function(p) { return +p[d]; }))
            //     .range([height, 0])
            //     .nice());
          }));

        // Add grey background lines for context.
        background = svg_adjusted.append("g")
                .attr("class", "background")
            .selectAll("path")
                .data(chartData)
            .enter().append("path")
                .attr("d", path);

        // Add blue foreground lines for focus.
        foreground = svg_adjusted.append("g")
                .attr("class", "foreground")
            .selectAll("path")
                .data(chartData)
            .enter().append("path")
                .attr("d", path);
                
        // Add a group element for each dimension.
        const g = svg_adjusted.selectAll(".dimension")
            .data(dimensions)
        .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; });

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d) { return d; });
        
        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function(d) { 
                d3.select(this).call(y[d].brush = d3.brushY()
                .extent([[-10,0], [10,height]])
                .on("brush", brush)           
                .on("end", brush)
                )
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);

        // Returns the path for a given data point.
        function path(d) {
            return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
        }

        // Handles a brush event, toggling the display of foreground lines.
        function brush() {  
            var actives = [];
            svg.selectAll(".brush")
            .filter(function(d) {
                    y[d].brushSelectionValue = d3.brushSelection(this);
                    return d3.brushSelection(this);
            })
            .each(function(d) {
                // Get extents of brush along each active selection axis (the Y axes)
                    actives.push({
                        dimension: d,
                        extent: d3.brushSelection(this).map(y[d].invert)
                    });
            });
            
            var selected = [];
            // Update foreground to only display selected values
            foreground.style("display", function(d) {
                let isActive = actives.every(function(active) {
                    let result = active.extent[1] <= d[active.dimension] && d[active.dimension] <= active.extent[0];
                    return result;
                });
                // Only render rows that are active across all selectors
                if(isActive) selected.push(d);
                return (isActive) ? null : "none";
            });
            
            // Render data as asimple grid
            // (actives.length>0)?out.text(d3.tsvFormat(selected)):out.text(d3.tsvFormat(sample_data));
        }
    }

    return chart;
}