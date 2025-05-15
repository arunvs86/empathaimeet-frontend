// import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
// import './App.css';
// import socketConnection from './webRTCutilities/socketConnection'
// import MainVideoPage from './videoComponents/MainVideoPage';
// import ProDashboard from './siteComponents/ProDashboard';
// import ProMainVideoPage from './videoComponents/ProMainVideoPage';

// const Home = ()=><h1>Hello, Home page</h1>

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route exact path="/" Component={Home} />
//         <Route path="/join-video" Component={MainVideoPage} />
//         <Route exact path="/dashboard" Component={ProDashboard} />
//         <Route exact path="/join-video-pro" Component={ProMainVideoPage} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route,HashRouter } from 'react-router-dom';
import './App.css';
import MainVideoPage from './videoComponents/MainVideoPage';
import ProMainVideoPage from './videoComponents/ProMainVideoPage';

function Home() {
  return <h1>Hello, Home page</h1>;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join-video" element={<MainVideoPage />} />
        <Route path="/join-video-pro" element={<ProMainVideoPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
