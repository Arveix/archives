import { Routes, Route } from 'react-router'
import './App.css'
import ArchiveHome from './pages/ArchiveHome'
import ArticlePage from './pages/ArticlePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ArchiveHome />} />
      <Route path="/article" element={<ArticlePage />} />
      <Route path="/article/:slug" element={<ArticlePage />} />
    </Routes>
  )
}
