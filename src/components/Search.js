import { Component } from 'react'

class Search extends Component {
    //statefull component managing the search fields
    generateErrorMessages(errors){
        //generates divs with error messages.
        let returnArray = [];
        for(let error in errors){
            returnArray.push(<div key={error} className="errorMessage">{errors[error]}</div>)
        }
        return returnArray;
    }

    render() {
        return (
            <div id="search">
                <div id="formContainer">
                    <form id="searchForm" onSubmit={this.props.newRequest}>
                        <div id="postCode" value={this.props.postCode} >
                            <label htmlFor="post">Post code: </label>
                            <input placeholder="ex. 18462 or 184 62" onChange={this.props.changePostCode} type="text" name="post"></input>
                        </div>
                            <div id="district" value={this.props.district} >
                            <label htmlFor="district">District: </label>
                            <input placeholder="ex. Åkersberga" onChange={this.props.changeDistrict} type="text" name="district"></input>
                            </div>
                        <div id="button">
                            <input id="submit" type="submit" value="Get Information"/>
                        </div>
                        {this.props.error && this.generateErrorMessages(this.props.error)}
                    </form>
                </div>
            </div>
        )
    }
}

export default Search
