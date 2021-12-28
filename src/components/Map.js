import React, { Component} from 'react';
import { GoogleMap, LoadScript, Marker} from '@react-google-maps/api';
import MarkedIcon from '../icons/school.svg'
import UnmarkedIcon from '../icons/school-outline.svg'

const containerStyle = {
  width: '400px',
  height: '400px'
};

class Map extends Component {
  constructor(props){
    super();
    this.actualSchoolIndex = this.actualSchoolIndex.bind(this);
    this.actualSchoolHandler = this.actualSchoolHandler.bind(this);
  }

  actualSchoolIndex(){
    //returns the index of the actual school code in the school.codes prop
    return this.props.schools.codes.findIndex(element=>element === this.props.actualSchool);
  }

  actualSchoolHandler(schoolId){
    this.props.changeActualSchool(schoolId);
  }

  render() {
    let actualSchoolIndex = this.props.schools && this.actualSchoolIndex();
    let coordinates = (this.props.schools)?this.props.schools.coordinates: null;
    return (
      <LoadScript googleMapsApiKey="">{//<===== your Google API key}
        <GoogleMap 
          mapContainerStyle={containerStyle}
          center={(this.props.actualSchool)?this.props.schools.coordinates[actualSchoolIndex]:{lat:62.2315,lng:16.1932}}
          zoom={(this.props.schools)?11:4}
        >
        {coordinates && 
          coordinates.map((location,index) => (
            <Marker key={`${index}${location.lat}${location.lng}`} 
              icon={(index === actualSchoolIndex)?MarkedIcon:UnmarkedIcon }
              position={location}
              onClick={this.actualSchoolHandler.bind(this,this.props.schools.codes[index])}
            />
          ))
        }
        </GoogleMap>
      </LoadScript>
    )
  }
}

export default Map