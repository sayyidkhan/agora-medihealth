import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import PatientLogin from './pages/PatientLogin'
import Consult from './pages/Consult'
import Status from './pages/Status'
import MyRecords from './pages/MyRecords'
import DoctorLogin from './pages/DoctorLogin'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorCase from './pages/DoctorCase'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PatientLogin />} />
        <Route path="/" element={<Landing />} />
        <Route path="/consult" element={<Consult />} />
        <Route path="/status/:id" element={<Status />} />
        <Route path="/my-records" element={<MyRecords />} />
        <Route path="/doctor" element={<DoctorLogin />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/case/:id" element={<DoctorCase />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
