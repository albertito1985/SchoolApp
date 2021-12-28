import './App.css';
import { React, Component } from 'react';
import Search from './components/Search';
import districts from './components/districts';
import Map from './components/Map';
import {BsFillArrowUpCircleFill} from 'react-icons/bs';

class App extends Component {
  constructor(){
    super();
    this.state={
      error: {},
      liveQuery:{
        postCode: "",
        district:""
      },
      displayed:{
        query: {
          postCode:"", 
          district:"", 
          latitude: "", 
          longitude: "",
        },
        schoolsList:{
          data:[],
          pageNumber:"",
          totalPages:""
        },
        extendedSchoolData:{
          actualSchool: "",
          locations:[{
            codes : [],
            coordinates: []
          }],
          data:[{}],
          stats:{generall:{}
        }
        }
      },
    };
    this.postCodeHandler = this.postCodeHandler.bind(this);
    this.schoolDataResultsToState = this.schoolDataResultsToState.bind(this);
    this.dataRequest = this.dataRequest.bind(this);
    this.newRequest = this.newRequest.bind(this);
    this.districtHandler = this.districtHandler.bind(this);
    this.geoCodingRequest = this.geoCodingRequest.bind(this);
    this.callExtendedData = this.callExtendedData.bind(this);
    this.handleDataRequest = this.handleDataRequest.bind(this);
    this.changePage = this.changePage.bind(this);
    this.pageRequest = this.pageRequest.bind(this);
    this.showExtendedContent = this.showExtendedContent.bind(this);
    this.callStatistics = this.callStatistics.bind(this);
    this.getRequest = this.getRequest.bind(this);
    this.parseStatistics = this.parseStatistics.bind(this);
    this.statsToState = this.statsToState.bind(this);
    this.focusAndError = this.focusAndError.bind(this);
    this.removeError = this.removeError.bind(this);
    this.updateGeoCodingState = this.updateGeoCodingState.bind(this);
  }
  componentDidMount(){
    //calls the generall school statistics after the component mounts since it will be shown in all school statistics
    this.callStatistics("generall");
  }
  
  newRequest(e){
    //evaluates the input data to make a new request to the Node server or not. It resets the component state
    //and converts the post adress to GPS code when the data from the front end passes the validation.
    if(e)e.preventDefault();
    if(this.compareWithOldQuery()){
      // do not process anything
    }else{
      //validation
      let error=[];
      if((this.state.liveQuery.postCode === "") || !(/\d{3}\s?\d{2}/.test(this.state.liveQuery.postCode))){
        error.push("post");
      }      
      if(this.state.liveQuery.district ===""){
        error.push("district")
      }else{
        let actualDistrict = this.state.liveQuery.district[0].toUpperCase()+this.state.liveQuery.district.substring(1);
        if(districts.find((value)=>{return(value === actualDistrict)}) === undefined){
          error.push("district")
        }
      }
      if(error.length > 0){
        this.focusAndError(e,error);
        this.removeError(e,error);
      }else{
        this.removeError(e,error);
        let generall=this.state.displayed.extendedSchoolData.stats.generall;
        this.setState({
          displayed:{
            query: {
              schoolType: "",
              postCode:"", 
              district:"", 
              latitude: "", 
              longitude: "", 
            },
            schoolsList:{
              data:[],
              pageNumber:"",
              totalPages:""
            },
            extendedSchoolData:{
              actualSchool: "",
              locations:[{
                codes : [],
                coordinates: [],
                selectedIndex:null
              }],
              data:[{}],
              stats: {
                generall:{
                  ...generall
                }
              }
            },
          }})
        this.geoCodingRequest();
      }
    }
  }

  focusAndError(e,specific){
    //adds the error class to the input fields who didnt passed the validation. It configures the error message.
    let input = e.target.elements;
    let message = {};
    specific.forEach((value)=>{
      if(!(input[value].classList.contains("error"))){
        input[value].classList.add("error");
      }
      if(value === "post"){
        message[value] = "Type a valid Post Code.";
      }else if(value === "district"){
        message[value]= "Type a valid District.";
      }
    });
    this.setState({error: {...message}});
  }

  removeError(e,specific){
    // removes the error class in the corrected input fields and updates the components error state.
    let input = e.target.elements;
    let fieldsArray= ["post","district"];
    if(specific.length=== 0){
      this.setState({error:{}});
    }
    specific.forEach((value)=>{
      if(fieldsArray.find((fieldValue)=>fieldValue===value)){
        let index = fieldsArray.findIndex((fieldValue)=>fieldValue===value);
        fieldsArray.splice(index,1);
      };
    });
    fieldsArray.forEach((value)=>{
      if(input[value].classList.contains("error")){
        input[value].classList.remove("error");
      }
    });
  };

  geoCodingRequest(){
    //Makes a request to the Google geoCoding API to convert a post adress in GPS codes (lat lng).
    let inputUri = encodeURIComponent(`${this.state.liveQuery.postCode} ${this.state.liveQuery.district}`);
    let address = `http://localhost:8080/geoCoding/${inputUri}`;
    this.getRequest(address,this.updateGeoCodingState);
  }

 updateGeoCodingState(data){
    //updates the components displayed query state and calls the dataRequest function.
    let displayed = {...this.state.displayed};
    displayed.query.latitude = data.results[0].geometry.location.lat;
    displayed.query.longitude = data.results[0].geometry.location.lng;
    this.setState({displayed: {...displayed}});
    this.dataRequest(data);
  }

  async dataRequest(locationObject,page=0){
    //Calls the Node server to redirect the request to the skolverket API asking for a list of schools based in GPS coordinates.
    // It then calls the handleDataRequest function.
    let lat = (locationObject)?locationObject.results[0].geometry.location.lat:this.state.displayed.query.latitude;
    let long = (locationObject)?locationObject.results[0].geometry.location.lng:this.state.displayed.query.longitude;
    console.log(lat);
    console.log(long);
    let address = `http://localhost:8080/dataRequest/${lat}/${long}/${page}`;
    let promise = await new Promise((resolve,reject)=>{
      this.getRequest(address,resolve);
    });
    this.handleDataRequest(promise,lat,long,page);
  }

  handleDataRequest(data,lat,long,page){
    //calls the callExtendedData and the schoolDataResultsToState function
    this.callExtendedData(data,page);
    this.schoolDataResultsToState(data,lat,long,page);
  }

  getRequest(address,callback){
    //function to make a simple GET request to the Node server. used in each call to the server.
    let xml = new XMLHttpRequest();
        xml.addEventListener("load", function(){
          let parsedResponse = JSON.parse(xml.responseText);
          callback(parsedResponse);
        });
        xml.open("GET",address);
        xml.setRequestHeader("accept", "application/vnd.skolverket.plannededucations.api.v2.hal+json");
        xml.send();
  }

  async callStatistics(school){
    //Makes another call to the Skolverkets API this time to ask for statistics about specific schools.
    //calls the statsToState function.
    let address;
    if(school==="generall"){
      address =`http://localhost:8080/StatisticsRequest/generall/`;
    }else{
      address =`http://localhost:8080/StatisticsRequest/${school}/`;
    }
    let stats = await new Promise( (resolve)=>this.getRequest(address,resolve));
    this.statsToState(this.parseStatistics(stats),school);
  }

  parseStatistics(stats){
    //it takes only the desired information from the statistics and returns a new object containing it.
    let returnObject = Object.keys(stats.body).reduce((previousValue,newValue)=>{
      if(newValue === "hasLibrary"){
        previousValue[newValue] = (stats.body[newValue])?"Yes":"No";
      }else if(newValue === "_links" || newValue==="docLinks" || newValue === "schoolUnit"){
        //do nothing
      }else{
        if(stats.body[newValue] === null ||
          stats.body[newValue].length === 0 ||
          stats.body[newValue][0].value ==="." ||
          stats.body[newValue][0].value ===".." ||
          stats.body[newValue][0].value === null ){
          previousValue[newValue] = "Not provided";
        }else{
          previousValue[newValue] = stats.body[newValue][0].value;
        }
      }
      return previousValue;
    },{})
    return returnObject;
  }

  statsToState(inputData,school){
    //it updates the displayed stats state.
    let displayed = {...this.state.displayed};
    let stats = {...this.state.displayed.extendedSchoolData.stats};
    if(school === "generall"){
      stats.generall={...inputData};
    }else{
      stats[school]={};
      stats[school] = {...inputData};
    };
    displayed.extendedSchoolData.stats = {...stats};
    this.setState({displayed : {...displayed}});
  }

  compareWithOldQuery(){
    //compares the actual query with the old one.
    if(this.state.liveQuery.postCode === this.state.displayed.query.postCode &&
      this.state.liveQuery.district === this.state.displayed.query.district){
      return true;
    }else{
      return false;
    }
  }

  pageRequest(page){
    //evaluates if it is necesary to make a new dataRequest by changing the results page.
    if(page === this.state.pageNumber){
      //do nothing
    }else if(this.state.displayed.schoolsList.data[page]){
      this.changePage(page);
    }else{
      this.dataRequest(null,page);
    }
  }

  changePage(pageNumber){
    //changes the displayed schoolsLisst pageNumber state to a new page.
    let displayed= {...this.state.displayed};
    displayed.schoolsList.pageNumber = pageNumber;
    displayed.extendedSchoolData.actualSchool = displayed.schoolsList.data[pageNumber][0].code;
    this.setState({displayed: {...displayed}});
  }

  async callExtendedData(inputData,page){
    //Makes a new call to the Skolverkets API to retrieve more information about each school in the list recived in the dataRequest function.
    //It takes only the needed information and passes it to the extendedDataResultsToState function. 
    let promiseArray = []
    inputData.body._embedded.listedSchoolUnits.forEach((school)=>{
      promiseArray.push(new Promise((resolve, reject)=>{
        this.getRequest(`http://localhost:8080/schoolRequest/${school.code}`,resolve)
      }));
    });
    let responseObject = {};
    Promise.all(promiseArray).then((values)=>{
      responseObject= values.reduce((previousValue, newValue)=>{
          previousValue.coordinates.push(
        {
          lat : parseFloat(newValue.body.wgs84_Lat),
          lng : parseFloat(newValue.body.wgs84_Long)
        });
          previousValue.codes.push(newValue.body.code);
          previousValue.data[newValue.body.code] = {
          code : newValue.body.code,
          name : newValue.body.name,
          contactInfo : {
            addresses : [{street:newValue.body.contactInfo.addresses[0].street}],
            email : newValue.body.contactInfo.email,
            telephone : newValue.body.contactInfo.telephone,
            web : newValue.body.contactInfo.web,
          },
          schoolYears: ((newValue.body.typeOfSchooling[1])?newValue.body.typeOfSchooling[0].schoolYears.concat(newValue.body.typeOfSchooling[1].schoolYears):newValue.body.typeOfSchooling[0].schoolYears),
          principalOrganizerType: newValue.body.principalOrganizerType
        };
        return previousValue;
      },{
        coordinates:[],
        codes:[],
        data:{}
      })
    }).then(()=>{
      responseObject.pageNumber=page;
      this.extendedDataResultsToState({...responseObject})
    });
  }

  async schoolDataResultsToState(data,lat,long,page=0){
    // Updates the schoolData state according to the data from the search.
    let displayed=this.state.displayed;
    let filteredData = data.body._embedded.listedSchoolUnits.map((school)=>{
      return {code:school.code,
        name:school.name}
    });
    displayed.schoolsList.data[data.body.page.number] = filteredData;
    displayed.schoolsList.totalPages = data.body.page.totalPages;
    displayed.query.postCode = this.state.liveQuery.postCode;
    displayed.query.district = this.state.liveQuery.district;
    displayed.query.latitude = lat;
    displayed.query.longitude = long;
    if(!(this.state.displayed.extendedSchoolData.locations[page])){
      displayed.extendedSchoolData.locations[page]=[];
    }
    this.setState({displayed: {...displayed}});
  }

  async extendedDataResultsToState(inputData){//fix
    //Called by the extendedDataRequest. Updates the extendedSchoolData state and calls the callStatistics function.
    let displayed = this.state.displayed;
    displayed.extendedSchoolData.data[inputData.pageNumber]= inputData.data;
    displayed.extendedSchoolData.actualSchool = displayed.schoolsList.data[inputData.pageNumber][0].code;
    displayed.extendedSchoolData.locations[inputData.pageNumber].codes= inputData.codes;
    displayed.extendedSchoolData.locations[inputData.pageNumber].coordinates= inputData.coordinates;
    displayed.schoolsList.pageNumber = inputData.pageNumber;
    await this.callStatistics(displayed.schoolsList.data[inputData.pageNumber][0].code);
    this.setState({displayed:{...displayed}});
  }

  async showExtendedContent(schoolId){
    //Evaluates if it is necessary to change the displayed extendedData SchoolId state to call the 
    //skolverkets API the statistics of a new school. 
    if(schoolId===this.state.displayed.extendedSchoolData.actualSchool){
      //do nothing
    }else{
      let displayed = this.state.displayed;
      displayed.extendedSchoolData.actualSchool = schoolId;
      await this.callStatistics(schoolId);
      this.setState({displayed: {...displayed}});
    }
  }

  generateLista(){
    //generates a list of schools according to the schoolData state.
    let page = this.state.displayed.schoolsList.pageNumber || 0;
    let listItems =  this.state.displayed.schoolsList.data[page].map((schoolObject,index)=>{
      return (<li key={`${page}${index}`} 
        className={(schoolObject.code === this.state.displayed.extendedSchoolData.actualSchool)? "selected": null}
        onClick={this.showExtendedContent.bind(this,schoolObject.code)}
        >{schoolObject.name}</li>);
    });
    return listItems;
  }

  postCodeHandler(e){
    let liveQuery = {...this.state.liveQuery};
    liveQuery.postCode = e.target.value;
    this.setState({liveQuery});
  }

  districtHandler(e){
    let liveQuery = {...this.state.liveQuery};
    liveQuery.district = e.target.value;
    this.setState({liveQuery});
  }
  
  pageBrowser(){
    //generates a page changer interface if necesary according to the recieved data.
    let li = [];
    if(this.state.displayed.schoolsList.totalPages>1){
      for(let i=1;i<=this.state.displayed.schoolsList.totalPages;i++){
        li.push(<li className={`pageBrowserLi${(i-1===this.state.displayed.schoolsList.pageNumber)? " selected":""}`}
          key={`browser${i}`}
          onClick={this.pageRequest.bind(this,i-1)}>{i}</li>);
      }
      return (<ul id="pageBrowser"><li className="pageLabel">Page:</li>{li}</ul>)
    }
    return null;
  }

  render(){
    return (
      <div id="App">
        <header>
          <div id="App-header">
            <h1 >School Search</h1>
          </div>
        </header>
        <div id="contentWrapper">
          <div id="content">
            <div id="controlls">
              {/* poner 20 px de margin top a la lista */}
              <Search error={this.state.error} postCode={this.state.liveQuery.postCode} changePostCode={this.postCodeHandler} district={this.state.liveQuery.district} changeDistrict={this.districtHandler} newRequest={this.newRequest}/>
              {(this.state.displayed.schoolsList.data.length > 0)? null: <WelcomeSearch/>}
              <div id="lista">
                  {this.state.displayed.schoolsList.totalPages>1 && <div id="pagesControll">{this.pageBrowser()}</div>}
                  {this.state.displayed.schoolsList.data.length>0 && <ul id="listaUl">{this.generateLista()}</ul>}
                
              </div>
            </div>
            {
            <div id="info" className={(this.state.displayed.extendedSchoolData.actualSchool)?"active":"welcome"}>
              {(this.state.displayed.extendedSchoolData.actualSchool)? 
              <SchoolInfo actualSchoolInfo={this.state.displayed.extendedSchoolData.data[this.state.displayed.schoolsList.pageNumber][this.state.displayed.extendedSchoolData.actualSchool]}
                generallStats={this.state.displayed.extendedSchoolData.stats.generall}
                actualStats= {this.state.displayed.extendedSchoolData.stats[this.state.displayed.extendedSchoolData.actualSchool]}/>
              :
              <Welcome/>}
            </div>}
            <div id="mapContainer">
              {<Map
                schools={this.state.displayed.extendedSchoolData.locations[this.state.displayed.schoolsList.pageNumber] || null}
                actualSchool={this.state.displayed.extendedSchoolData.actualSchool}
                changeActualSchool={this.showExtendedContent}
              />}
            </div>
          </div>
        </div>      
      </div>
    );
  }
}

function SchoolInfo(props){
  //Stateless component which generates the tables containing info about a certain school to display.
  function generateInfo(){
    //generates the tables containing information about a school. 
    const aspects = {
      order:[
        "resources","sixthGrade","ninethGrade"
      ],
      titles:{
        sixthGrade: "Sixth grade",
        ninethGrade: "Nineth grade",
        resources: "Resources"
      },
      sixthGrade: {
        averageResultNationalTestsSubjectENG6thGrade: "National Test English",
        averageResultNationalTestsSubjectMA6thGrade: "National Test Math",
        averageResultNationalTestsSubjectSVA6thGrade: "National Test SVA",
        averageResultNationalTestsSubjectSVE6thGrade: "National Test Swedish",
        ratioOfPupilsIn6thGradeWithAllSubjectsPassed: "Pupils approved in all subjects"
      },
      ninethGrade: {
        averageGradesMeritRating9thGrade: "Merits",
        averageResultNationalTestsSubjectENG9thGrade: "National Test English",
        averageResultNationalTestsSubjectMA9thGrade: "National Test Math",
        averageResultNationalTestsSubjectSVA9thGrade: "National Test SVA",
        averageResultNationalTestsSubjectSVE9thGrade: "National Test Swedish",
        ratioOfPupilsIn9thGradeWithAllSubjectsPassed: "Pupils approved in all subjects",
        ratioOfPupils9thGradeEligibleForNationalProgramES: "Aesthetics",
        ratioOfPupils9thGradeEligibleForNationalProgramNATE: "Natural sciences or Technology",
        ratioOfPupils9thGradeEligibleForNationalProgramSAEKHU: "Social sciencis, Economy or Humanities",
        ratioOfPupils9thGradeEligibleForNationalProgramYR: "Pre-vocational programmes",
      },
      resources:{
        certifiedTeachersQuota: "Cetified Teachers",
        specialEducatorsQuota: "Special educators",
        specialTeacherPositions: "Special teacher positions",
        studentsPerTeacherQuota: "Students per teacher",
        totalNumberOfPupils: "Number of pupils",
        hasLibrary: "Library facilities"
      }
    }

    return(<>
    <h2>General information:</h2>
    <table id="infoTable">
      <tbody>
        <tr>
          <th>Adress:</th>
          <td>{props.actualSchoolInfo.contactInfo.addresses[0].street || "Not provided"}</td>
          <th>E-mail:</th>
          <td><a href={`mailto:${props.actualSchoolInfo.contactInfo.email}`}>{props.actualSchoolInfo.contactInfo.email || "Not provided"}</a></td>
        </tr>
        <tr>
          <th>Telephone:</th>
          <td><a href={`tel:${props.actualSchoolInfo.contactInfo.telephone}`}>{props.actualSchoolInfo.contactInfo.telephone || "Not provided"}</a></td>
          <th>Web:</th>
          <td><a target="_blank" rel="noopener noreferrer" href={props.actualSchoolInfo.contactInfo.web}>{props.actualSchoolInfo.contactInfo.web || "Not provided"}</a></td>
        </tr>
        <tr>
          <th>School Years:</th><td>{props.actualSchoolInfo.schoolYears.toString()}</td>
          <th>Organizer type:</th><td>{props.actualSchoolInfo.principalOrganizerType}</td>
        </tr>
      </tbody>
    </table>
    <h2 key={`AvailableStatistics`}>Available statistics:</h2>
        {aspects.order.map((value)=>{
          return(<div id="statsWrapper" key={`${aspects.titles[value]}Wrapper`}>
          <h3 >{aspects.titles[value]}</h3>
          <table id={aspects.titles[value]} className="statsTable">
            <tbody>
              <tr>
                <th>Aspect</th>
                <th>Average</th>
                <th>{props.actualSchoolInfo.name}</th>
              </tr>
              {Object.keys(aspects[value]).map((value2)=>{
                return (<tr key={`${aspects.titles[value]}${value2}`}>
                  <th>{aspects[value][value2]}</th>
                  <td>{props.generallStats[value2]}</td>
                  <td>{props.actualStats[value2]}</td>
                </tr>)
              })}
            </tbody>
          </table>
          </div>)
        })}
    </>)
  }
  return(<div id="schoolInfo">
            <h1>{props.actualSchoolInfo.name}</h1>
            {generateInfo()}
  </div>)
}

function Welcome(){
  //stateless component with welcome message
  return(
    <div id="welcome">
      <h1>Welcome to School Search</h1>
      <p>Information about schools in your area.</p>
    </div>
  )
}

function WelcomeSearch(){
  //stateless component to indicate where to start.
  return(
    <div id="welcomeSearch">
      <div id="arrow"><BsFillArrowUpCircleFill size={40}/></div>
      <h2>Fill in to start</h2>
    </div>
  )
}

export default App;