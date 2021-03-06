import React from "react";
import Convert from  'ansi-to-html';
import loadingsvg from './tail-spin.svg';
import scrollIntoView from 'scroll-into-view';
require('./console.less');
import last from 'ramda/src/last'
export default React.createClass({
  getInitialState(){
    return {logPinned: false}
  },
  componentDidMount(){
    this._scrollToLine(this.selectedHash());
    document.getElementById('mainContainer').addEventListener('scroll',this._onLogScroll);
  },
  componentWillUnmount() {
    document.getElementById('mainContainer').removeEventListener('scroll',this._onLogScroll);
  },
  selectedHash(){
    return this.props.selectedLine;
  },
  componentDidUpdate(){
    if(this.state.logPinned){
      this._scrollToBottom();
    }else{
      this._scrollToLine(this.selectedHash());
    }
  },
  _isBuildLoaded(){
    return this.props.log && this.props.log.size > 1;
  },
  render(){
    return <span  id="buildLog">
      <pre> 
        <span ref="buildLog" >
          {this._scrollButtons()}
          {this._renderLog(this.props.log)} 
          {this._spinner()} 
        </span>
      </pre>
      <span id="bottom" ref="bottom"/>
    </span>;
  },
  _spinner(){
    return this.props.inProgress? <img src={loadingsvg} />: <span/>;
  },
  _scrollButtons(){
    const color = this.state.logPinned? "green": "white" ; 
    return ( <div  ref="floatingMenu" className="floatingMenu">
      <paper-toolbar middleJustify="start">
        <paper-icon-button  onClick={this._fullLog} icon="reorder" ></paper-icon-button>
        <paper-icon-button style = {{color}} icon="arrow-drop-down-circle" onClick={this._onPinLog} ></paper-icon-button>
      </paper-toolbar>
    </div>);
  },
  _fullLog(e){
    e.preventDefault();
    window.location = window.rootURL+"/"+this.props.url+"/consoleText";
  },
  _setInitialTop(){
    if(!this.intialTop){
      this.intialTop = this.refs.buildLog.getBoundingClientRect().top;
    }
  },

  _onLogScroll(e){
    this._setInitialTop();
    const newPos = this.refs.buildLog.getBoundingClientRect().top
    const scroll =  this.intialTop - newPos;
    // console.log(`Initial : ${this.intialTop}  newPos: ${newPos} scroll: ${Math.abs(scroll)}`);
    this.refs.floatingMenu.style.top= Math.abs(scroll)+"px"
  },
  _onPinLog(e){
    this.setState({logPinned: !this.state.logPinned});
    this._scrollToBottom(e);
  },
  _scrollToBottom(e){
    if(e){
      e.preventDefault();
    }
    this._setInitialTop();
    scrollIntoView( this.refs.bottom);
    this._onLogScroll();
  },
  _onLineSelect(event){
    if(event.target.tagName === 'SPAN'|| event.target.tagName === 'A'){
      event.stopPropagation();
    }
    if(event.target.tagName === 'A'){
      const lineId = event.currentTarget.getAttribute('id');
      this.props.actions.LineSelect(lineId);
    }
  },
  _scrollToLine(lineId){
    if(lineId){
      const line = document.getElementById(lineId);
      if(line)
        scrollIntoView(line);
    }
  },
  _isLineSelected(lineNumber){
    return `L${lineNumber}`  === this.selectedHash();
  },
  _openFold(e){
    const left = e.target.getClientRects()[0].left;
    if(e.clientX < left + 50){
      e.stopPropagation();
      e.currentTarget.classList.toggle('closed');
      e.currentTarget.classList.toggle('open');
    }
  },
  _logFold(lines,startIdx,isLast){
    if(lines.length  === 1){
      return this._logLine(lines[0],startIdx);
    }
    const selectedLine = this.selectedHash()!=''? parseInt(this.selectedHash().replace("L",'')) :0;
    const lineSelectedInFold = selectedLine > startIdx && selectedLine < startIdx + lines.length;
    const isOpen = isLast || lineSelectedInFold; 
    const logLines = lines.reduce((list,line,idx) => {
      list.push( this._logLine(line,idx+startIdx))
      return list;
    }, []);
    return <div key={'fold'+(startIdx)} className={"fold "+ (isOpen? "open":"closed")} onClick={this._openFold}>{logLines}</div>
  },
  _logLine(log,idx){
    return (<p dangerouslySetInnerHTML={{__html: "<a></a><span>"+new Convert().toHtml(this.escapeHtml(log)) + "</span>"}}
      key={idx} className={this._isLineSelected(idx)?'highlight':''} id={`L${idx}`} onClick={this._onLineSelect}>
    </p>);
  },
  entityMap:{
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  },
  escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g,s =>  this.entityMap[s])
  },
  _renderLog(logLines){
    const log =this.props.log;
    // _logFold(lines,startIdx,isLast){
    let startIdx =1 ; 
    return log.reduce((groups,logGroup,idx) =>{
      const fold = this._logFold(logGroup,startIdx,idx == log.length-1);
      groups.push(fold);
      startIdx+=logGroup.length;
      return groups;
    },[]);
  }

});
