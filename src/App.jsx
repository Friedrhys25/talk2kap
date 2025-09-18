import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Sidebar from './Components/Sidebar'
import Purok from './Components/Purok'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='flex min-h-screen p'>
      <Sidebar />
    </div>
  )
}

export default App
