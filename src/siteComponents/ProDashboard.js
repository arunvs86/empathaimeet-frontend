import { useEffect, useState } from 'react';
import './ProDashboard.css'
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socketConnection from '../webRTCutilities/socketConnection';
import proSocketListeners from '../webRTCutilities/proSocketListeners';
import moment from 'moment';
import { useDispatch } from 'react-redux';

const ProDashboard = ()=>{

    const [ searchParams, setSearchParams ] = useSearchParams();
    const navigate = useNavigate();
    const [ apptInfo, setApptInfo ] = useState([]);
    const [ clientLinks, setClientLinks ] = useState({});

    const dispatch = useDispatch();

    useEffect(()=>{
        //grab the token var out of the query string
        const token = searchParams.get('token');
        const socket = socketConnection(token);
        proSocketListeners.proDashabordSocketListeners(socket,setApptInfo,dispatch);
    },[])

    const joinCall = (appt)=>{
        console.log(appt);
        const token = searchParams.get('token');
        //navigate to /join-video-pro
        navigate(`/join-video-pro?token=${token}&uuid=${appt.uuid}&client=${appt.clientName}`)
    }

    const generateClientLink = async (appt) => {
        try {
          const resp = await axios.get(  `https://empathai-server-gkhjhxeahmhkghd6.uksouth-01.azurewebsites.net/validate-link`,
             {
            params: { uuid: appt.uuid }
          });
          setClientLinks(links => ({
            ...links,
            [appt.uuid]: resp.data.link
          }));
        } catch (err) {
          console.error('Could not generate client link:', err);
        }
      };

    return(
        <div className="container">
            <div className="row">
                <div className="col-12 main-border purple-bg"></div>
            </div>
            <div className="row">
                
                <div className="col-8">
                    <div className="row">
                        <h1>Dashboard</h1>
                        <div className="row num-1">
                            <div className="col-6">
                                <div className="dash-box clients-board orange-bg">
                                    <h4>Clients</h4>
                                    <li className="client">Jim Jones</li>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="dash-box clients-board blue-bg">
                                    <h4>Coming Appointments</h4>
                                    {console.log(apptInfo)}
                                    {apptInfo.map(a => (
  <div key={a.uuid}>
    <li className="client">
      {a.clientName} – {moment(a.apptDate).calendar()}

      {/* always show Generate Client Link */}
      <button
        className="btn btn-sm btn-primary ms-2"
        onClick={() => generateClientLink(a)}
      >
        Generate Client Link
      </button>
      {clientLinks[a.uuid] && (
        <div className="mt-1">
          <a
            href={clientLinks[a.uuid]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {clientLinks[a.uuid]}
          </a>
        </div>
      )}

      {/* show Join Pro only once a.waiting becomes true */}
      {a.waiting && (
        <>
          <div className="waiting-text d-inline-block">
            Waiting
          </div>
          <button
            className="btn btn-danger join-btn"
            onClick={() => joinCall(a)}
          >
            Join Pro
          </button>
        </>
      )}
    </li>
  </div>
))}

                                    
                                </div>
                                
                            </div>
                        </div>
                        <div className="row num-2">
                            <div className="col-6">
                                <div className="dash-box clients-board green-bg">
                                    <h4>Files</h4>
                                    <div className="pointer"><i className="fa fa-plus"></i> <i className="fa fa-folder"></i></div>
                                    <div className="pointer"><i className="fa fa-plus"></i> file</div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="dash-box clients-board redish-bg">
                                    <h4>Analytics</h4>
                                    <div className="text-center">
                                        <img src="https://s3.amazonaws.com/robertbunch.dev.publicresources/722443_infographic07.jpg" />
                                    </div>
                                </div>
                            </div>

                            

                        </div>
                    </div>
                    <div className="row num-2">
                        <div className="col-4 calendar">
                            <img src="https://s3.amazonaws.com/robertbunch.dev.publicresources/calendar.png" />
                        </div>    
                    </div>
                </div>



            </div>            
        </div>
    )
}

export default ProDashboard