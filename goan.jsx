
var React = require('react');
var ReactDOM = require('react-dom');
var Moment = require('moment');
var DatePicker = require('react-datepicker');
var $ = require('jQuery');
var ReactD3 = require('react-d3-components');
var BarChart = ReactD3.BarChart;

var GoanChart = React.createClass({
    initialState: {
        from: Moment().subtract(1, "months"),
        to: Moment().add(1, "months"),
        endPoint: "http://localhost/goan",
        entryType: "general",
        auth: "",
        data: [],
        types: [],
        width: 600,
        height: 200,
        view: "start",
        message: "",
    },
    
    propTypes: {
        endPoint: React.PropTypes.string.isRequired,
        auth: React.PropTypes.string.isRequired,
        entryType: React.PropTypes.string,
        from: React.PropTypes.objectOf(Moment),
        to: React.PropTypes.objectOf(Moment)
    },
    
    getInitialState: function(){
        return this.initialState;
    },
    
    componentDidMount: function() {
        var state = this.state;
        state.from = this.props.from && this.props.from !== "" ? this.props.from : state.from;
        state.to = this.props.to && this.props.to !== "" ? this.props.to : state.to;
        state.endPoint = this.props.endPoint && this.props.endPoint !== "" ? this.props.endPoint : state.endPoint;
        state.auth = this.props.auth && this.props.auth !== "" ? this.props.auth : state.auth;
        state.entryType = this.props.entryType && this.props.entryType !== "" ? this.props.entryType : state.entryType;
        state.width = ReactDOM.findDOMNode(this).clientWidth;
        this.setState(state);
        this.getEntries();
    },
    
    getEntries: function(){
        //we need to get a list of entries
        var schema = this;
        var url = this.state.endPoint;
        if(url.charAt(url.length - 1) !== '/'){
            url += '/';
        }
        url += "types";
        
        var data = {auth: this.state.auth};
        
        $.ajax({
            type: "GET",
            url: url,
            data: data,
            cache: false,
            dataType: 'json',
            crossDomain: true,
            success: function (response) {
                console.log(response);
                schema.setState({types: response.data}, function(){
                    schema.getData();
                });
            },
            error: function (jqXHR) {
                schema.setState({message: "Error: Could not get the entry types. Check your connection to the GOAN server and all props", view: "error"});
            }
        });
    },
    
    getData: function() {
        var schema = this;
        var url = this.state.endPoint;
        if(url.charAt(url.length - 1) !== '/'){
            url += '/';
        }
        url += 'types/' + this.state.entryType;
        
        var data = {auth: this.state.auth};
        data.from = this.state.from.format("YYYY-MM-DD");
        data.to = this.state.to.format("YYYY-MM-DD");
        
        $.ajax({
            type: "GET",
            url: url,
            data: data,
            cache: false,
            dataType: 'json',
            crossDomain: true,
            success: function (response) {
                schema.parseData(response.data);
            },
            error: function (jqXHR) {
                schema.setState({message: "Error: Could not get the entry types. Check your connection to the GOAN server and all props", view: "error"});
            }
        });
        
    },
    
    parseData: function(raw){
        var data = {};
        for(var i = 0; i < raw.length; i++){
            var date = Moment(raw[i].created).format("YYYY-MM-DD");
            if(!data.hasOwnProperty(date)){
                data[date] = [];
            }
            data[date].push(raw[i]);
        }
        //great, now we need to transform it into an array
        var parsedData = [];
        for(var key in data){
            if(data.hasOwnProperty(key)){
                parsedData.push({x: key, y: data[key].length});
            }
        }
        this.setState({data: parsedData});
    },
    
    changeEntryType: function(event){
        var schema = this;
        if(event.target.value !== ""){
            schema.setState({entryType: event.target.value}, function(){
                schema.getData();
            });
        }
    },
    
    handleChangeInRange: function(type, event){
        var schema = this;
        var state = this.state;
        state[type] = event;
        schema.setState(state, function(){
            schema.getData();
        });
    },
    
    buildSelector: function() {
        
        var entryOptions = [];
        entryOptions.push(<option key={-1} value="">Select an Entry Type</option>);
        for(var i = 0; i < this.state.types.length; i++){
            var e = this.state.types[i];
            entryOptions.push(<option key={i} value={e}>{e}</option>);
        }
        
        return (
            <div className="row" style={{marginBottom: "15px"}}>
                <div className="col-md-4">
                    Entry Type: <select className="form-control goan-entry-select"
                        value={this.state.entryType}
                        defaultValue={this.state.entryType}
                        onChange={this.changeEntryType}
                        >{entryOptions}</select>
                </div>
                <div className="col-md-4">
                    From: <DatePicker
                            selected={this.state.from}
                            onChange={this.handleChangeInRange.bind(this, "from")} 
                            className='form-control'/>
                </div>
                <div className="col-md-4">
                    To: <DatePicker
                            selected={this.state.to}
                            onChange={this.handleChangeInRange.bind(this, "to")} 
                            className='form-control'/>
                </div>
            </div>
        );
    },
    
    render: function(){
        var template = (<div>Loading...</div>);
        //var top = this.buildSelector();
        var top = this.buildSelector();
        var chart = (<div></div>);
        if(this.state.data.length > 0){
            chart = (
                <BarChart
                    data={{values: this.state.data, label: this.state.entryType}}
                    width={this.state.width}
                    height={this.state.height}
                    margin={{top: 10, bottom: 50, left: 50, right: 10}}/>
            );
        }else {
            chart = (
                <div><strong>No data was found for that criteria!</strong></div>
            );
        }
        if(this.state.view === "error") {
            //replace the chart with an error
            chart = (<div className="bg-danger"><p>{this.state.message}</p></div>);
        }
        return (
            <div className="panel panel-default">
                <div className="panel-body">
                    <div className="row">
                        <div className="col-md-12" style={{textAlign: "center"}}>
                            <strong>Viewing Entries for {this.state.entryType}</strong>
                        </div>
                    </div>
                    {top}
                    <div className="row">
                        <div className="col-md-12" style={{textAlign: "center"}}>
                            {chart}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = GoanChart;