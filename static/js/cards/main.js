class Card {

    /* CONSTRUCTOR */
    constructor(feat_name, data, selected_characters, div_id, height, description) {
        this.feat_name = feat_name;
        this.data = data
        this.div_id = div_id;
        this.svg = {}
        this.svg.height = height
        this.selected_characters = selected_characters
        this.description = description
        this.selected_chapter = false;
        self.annotations = []
        // this.viz_dict = {"Actions": this.visualize_actions(this)}
        this.create_shorthand()
        this.create_card()    
    }

    create_shorthand(){
        var self = this;
        self.shorthands = {}
        self.data['characters'].forEach(c => {
            var spl = c.split(" ")
            var sh = spl[0]
            spl.slice(1).forEach(s => {
                if (typeof s[0] !== 'undefined')
                    sh += " " + s[0]
            })
            sh += "."
            self.shorthands[c] = sh
        });
        // console.log(self.shorthands)
    }

    filter_by_characters(data, characters) {
        if (!characters.length)
            return data

        if (characters.indexOf("all") != -1)
            return data

        var filtered_data = data.filter(d => characters.indexOf(d['character']) != -1)
        return filtered_data
    }
    create_card(){
        var self = this;
        var html_string = '<div class="ui fluid card">' +
            '<div class="content">' +
                '<i class="ui icon close mini right floated meta"></i>' +
                '<div id="'+self.feat_name+'_meta" class="meta">' + self.feat_name +
            '<i id="' + self.feat_name +'_popup" class="ui info circle icon mini meta" data-variation="wide" data-content="'+self.description+'"></i>'+
                '</div>'+
                '<div id="'+ self.feat_name +'_svg">' +
            '</div>' +
        '</div>'

        $('#' + self.div_id).append(html_string)
        $("#"+self.feat_name +"_popup")
            .popup({})

        // console.log(self.svg.color_legend)
        self.svg.svg_id =  self.feat_name +'_svg'
        self.svg.margin = { top: 5, right: 0, bottom: 15, left: 70 }
        self.svg.width = $("#" +self.div_id).width() - self.svg.margin.left - self.svg.margin.right;
        self.svg.height = self.svg.height - self.svg.margin.top - self.svg.margin.bottom;

        // define scales
        self.svg.x = d3.scaleLinear()
            .range([self.svg.margin.left, self.svg.width - self.svg.margin.right]);

        self.svg.y = d3.scaleBand()
            .padding(0.1)
            .range([self.svg.margin.top, self.svg.height - self.svg.margin.bottom]);

        self.x_domain = [0, ED.quill.getText().length]
        if(name == "the_quest_of_the_silver_fleece")
            self.x_domain = [0, 259998]
        self.svg.x.domain(self.x_domain)
        // calculate and define y scale
        // Currently using the 'sentiment_emotion_data' since it has all the part and chapters in it
        // will have to come up with a generic solution
        if (self.selected_characters.length)
            self.y_domain = self.selected_characters
        else{
            self.y_domain = d3.rollups(VIZ['data']['sentiment_emotion_data'], v => v.length, d => d.character)
                .sort((a, b) => d3.descending(a[1], b[1])).map(d => d[0])
        }
        self.svg.y.domain(self.y_domain);

    }

}