
var React = require('react');
var ReactDOM = require('react-dom');
var Moment = require('moment');
var DatePicker = require('react-datepicker');
var $ = require('jQuery');
var ReactD3 = require('react-d3-components');
var BarChart = ReactD3.BarChart;

/**
* GoanChart is a React component that connects to a goan server and displays returned data. It is useful for
* quick analytics. It will display events by data. Future improvements include showing references and notes
*
* @class GoanChart
*/
var GoanChart = React.createClass({
    
    /**
    * The initial state of the application, broken into a property in case the state ever needs to be reset
    *
    * @property initialState
    * @type {Object}
    */
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
    
    /**
    * The prop types GoanChart expects to receive
    *
    * Will accept the following:
    * - endPoint - The API endpoint for the GOAN server. For example, https://localhost:44889/v1/ - REQUIRED
    * - auth - The auth token for your GOAN instance - REQUIRED
    * - entryType - The default entry type to look up - OPTIONAL 
    * - from - The start date for narrowing a selection down - OPTIONAL
    * - to - The end date for narrowing a selection down - OPTIONAL
    * 
    * @property propTypes
    * @type {Object}
    */
    propTypes: {
        endPoint: React.PropTypes.string.isRequired,
        auth: React.PropTypes.string.isRequired,
        entryType: React.PropTypes.string,
        from: React.PropTypes.objectOf(Moment),
        to: React.PropTypes.objectOf(Moment)
    },
    
    /**
    * Gets the initial state of the component, a React lifecycle hook
    *
    * Immediately returns the blank initial state property
    *
    * @method getInitialState
    */
    getInitialState: function(){
        return this.initialState;
    },
    
    /**
    * Once the component mounts, we check the props and update the state. We also get the width of the DOM node to make
    * the svg chart the correct width
    *
    * Once setup, calls getEntries()
    *
    * @method componentDidMount
    */
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
    
    /**
    * Get a list of unique entry types from the Goan server and put them in a selector
    *
    * @method getEntries
    */
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
                schema.setState({types: response.data}, function(){
                    schema.getData();
                });
            },
            error: function (jqXHR) {
                schema.setState({message: "Error: Could not get the entry types. Check your connection to the GOAN server and all props", view: "error"});
            }
        });
    },
    
    /**
    * Gets the entries that occurred between the from and to specified in the state
    *
    * Passes the date returned into parseData()
    *
    * @todo Add toggle for adding dates with 0 that don't have any entries
    *
    * @method getData
    */
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
    
    /**
    * Parses the data returned from getData() into a format for the charting library, currently D3
    *
    * @method parseData
    */
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
    
    /**
    * When the entry type is changed, we get the new type and call into getData() to update the chart. This is called in
    * the entry type <select>. Once updated, getData() is called
    *
    * @method handleChangeEntryType
    */
    handleChangeEntryType: function(event){
        var schema = this;
        if(event.target.value !== ""){
            schema.setState({entryType: event.target.value}, function(){
                schema.getData();
            });
        }
    },
    
    /**
    * Handle the change in the from or to DatePicker components. Each DatePicker has a bind in the onChange handler to specify whether
    * the type is "from" or "to" and then the state is updated and getData() is called
    *
    * @method handleChangeInRange
    */
    handleChangeInRange: function(type, event){
        var schema = this;
        var state = this.state;
        state[type] = event;
        schema.setState(state, function(){
            schema.getData();
        });
    },
    
    /**
    * Builds out the selector div at the top of the chart. Contains the entry <select> and two DatePicker components
    *
    * Utilized by the render() method
    *
    * @method buildSelector
    */
    buildSelector: function() {
        var entryOptions = [];
        entryOptions.push(<option key={-1} value="">Select an Entry Type</option>);
        for(var i = 0; i < this.state.types.length; i++){
            var e = this.state.types[i];
            entryOptions.push(<option key={i} value={e}>{e}</option>);
        }
        
        return (
            <div className="row goan-row" style={{marginBottom: "15px"}}>
                <div className="col-md-4 goan-form-container goan-entry-select-container">
                    Entry Type: <select className="form-control goan-entry-select"
                        value={this.state.entryType}
                        defaultValue={this.state.entryType}
                        onChange={this.handleChangeEntryType}
                        >{entryOptions}</select>
                </div>
                <div className="col-md-4 goan-form-container goan-from-select-container">
                    From: <DatePicker
                            selected={this.state.from}
                            onChange={this.handleChangeInRange.bind(this, "from")} 
                            className='form-control goan-from-select'/>
                </div>
                <div className="col-md-4 goan-form-container goan-to-select-container">
                    To: <DatePicker
                            selected={this.state.to}
                            onChange={this.handleChangeInRange.bind(this, "to")} 
                            className='form-control goan-to-select'/>
                </div>
            </div>
        );
    },
    
    /**
    * Controls the rendering of the component. This will build the top selector container first then, if there is data, display
    * the chart. If there is an error, such as cannot connect, an error message will show up here as well.
    *
    * @method render
    */
    render: function(){
        var template = (<div>Loading...</div>);
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
                    <div className="row goan-row">
                        <div className="col-md-12 goan-title-container" style={{textAlign: "center"}}>
                            <strong>Viewing Entries for {this.state.entryType}</strong>
                        </div>
                    </div>
                    {top}
                    <div className="row goan-row">
                        <div className="col-md-12 goan-chart-container" style={{textAlign: "center"}}>
                            {chart}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = GoanChart;