class Context extends Card {
    constructor(feat_name, data, data_key, selected_characters, div_id, height, description) {
        super(feat_name, data, selected_characters, div_id, height, description)
        var self = this;
        self.isClicked = false
        self.svg.yAxis = false
        self.data_key = data_key
        self.selected_data = self.data_prep(self.data[self.data_key], self.feat_name, false, -1, this.selected_characters)
        self.chart = self.visualize_tags()
        $("#" + self.svg.svg_id).append(self.chart)
        self.chart.update(self.selected_data, self.x_domain)
        // $("#" + self.feat_name + "_meta").append('<span>Chapters &#8594</span>')
    }
    textPosition(data){
        var self = this;
        var pos_arr = {}
        for (var i = Math.ceil(self.svg.zx.range()[0]); i <= Math.floor(self.svg.zx.range()[1]); i++){
            pos_arr[i] = {}
            for(var j = 0; j <= self.svg.height; j++)
                pos_arr[i][j] = 0
        }
        // console.log(pos_arr)

        data.forEach(d => {
            var textWidth = Math.ceil(self.textSize(d.tag).width)
            var x_pos = Math.ceil(self.svg.zx(d.start_char))
            d.height = 20
            // console.log(x_pos + textWidth)
            if (x_pos + textWidth > Math.floor(self.svg.zx.range()[1])){
                textWidth = Math.floor(self.svg.zx.range()[1]) - x_pos
                d.height = 40
                // console.log(x_pos + textWidth)
            }

            var y = 0
            // console.log(pos_arr[x_pos][y], pos_arr[x_pos + textWidth][y])

            if ((pos_arr[x_pos][y] == 0) && (pos_arr[x_pos+textWidth][y] == 0)){
                d.x = x_pos
                d.width = textWidth
                d.y = y
            }
            else{
                for (var j = y; j < self.svg.height; j = j+20){
                    // console.log(j, pos_arr[x_pos][j])
                    if ((pos_arr[x_pos][j] == 0) && (pos_arr[x_pos + textWidth][j] == 0)) {
                        d.x = x_pos
                        d.width = textWidth
                        d.y = j
                        break
                    }
                }
            }

            if ("y" in d){
                for(var i = x_pos; i <= (x_pos + textWidth); i++){
                    for(var j = y; j <= d.y; j++){
                        pos_arr[i][j] = 1
                    }
                }
            }
            else{
                d.y = -1
            }
        })
        return data
    }
    data_prep(data, feat_name, selected_part = false, selected_chapter = -1, selected_characters = []) {
        var self = this
        var selected_data = data
        if (selected_chapter >= 0) {
            // console.log("filter")
            selected_data = data.filter(d => (d.part == selected_part) && (d.chapter == selected_chapter)) 
        }
        
        selected_data = d3.flatRollup(selected_data, v => v.length,
            d => d.part, d => d.chapter, d => d[feat_name]).map(d => (
                {
                    part: d[0], chapter: d[1], [feat_name]: d[2],
                    start_char: self.data.chapters_map[d[0]].chapters[d[1]].start_char,
                    end_char: self.data.chapters_map[d[0]].chapters[d[1]].end_char
                }
            ))
        
        // console.log(selected_data)
        // selected_data = self.filter_by_characters(selected_data, selected_characters)
        return selected_data
    }
    textSize(text) {
        var container = d3.select('body').append('svg');
        container.append('text').attr("x", -99999).attr("y", -99999).text(text);
        var size = container.node().getBBox();
        container.remove();
        return { width: size.width, height: size.height };
    }
    wrap(text, width) {
        text._parents.forEach(function (t) {
            var text = d3.select(t),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", -10).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", -10).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
    visualize_tags() {
        var self = this;

        self.svg.g = d3.create("svg")
            .attr("width", self.svg.width)
            .attr("height", self.svg.height)
            .attr("viewBox", [0, 0, self.svg.width, self.svg.height]);

        // self.create_annotation()

        self.svg.y = d3.scaleLinear()
            .range([self.svg.margin.top, self.svg.height - self.svg.margin.bottom])
            .domain([0, 100])

        self.svg.zx = self.svg.x.copy()
        self.svg.zy = self.svg.y.copy()

        self.svg.bars = self.svg.g
            .selectAll(".tags_bar")

        return Object.assign(self.svg.g.node(), {
            update(data, domain) {
                const t = self.svg.g.transition().duration(750);
                console.log("animate!")
                self.svg.zx.domain(domain);

                self.selected_data = self.textPosition(data)

                self.stroke = 0.3
                self.padding = 0
                
                self.svg.g.selectAll("*").remove()

                $("#" + self.feat_name + "_meta").children('.time_axis').remove()
                if (VIZ.isClicked)
                    $("#" + self.feat_name + "_meta").append('<span class="time_axis" style="font-size:1rem">Sentences &#8594</span>')
                else
                    $("#" + self.feat_name + "_meta").append('<span class="time_axis" style="font-size:1rem">Chapters &#8594</span>')

                // plot colored presence bars
                self.svg.texts = self.svg.bars
                    .data(data.filter(d => d.y != -1))
                    .enter()
                    .append("foreignObject")
                    .attr("transform", "translate(0, 0)")
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)
                    .attr("width", d => d.width)
                    .attr("height", d => d.height)
                    .append("xhtml:div")
                    .html(d => "<div>" + d.tag + "</div>")

                // plot colored presence bars
                self.svg.rects = self.svg.bars
                    .data(data.filter(d => d.y != -1))
                    .enter()
                    .append("rect")
                    .attr("class", self.feat_name + "_bar features_unit")
                    .attr("fill", "none")
                    // .attr("opacity", 0.1)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("x", d => d.x - 1)
                    .attr("y", d => d.y)
                    .attr("width", d => d.width + 1)
                    .attr("height", d => d.height)         
            }
        });

    }
    install_events() {
        var self = this;
    }
}