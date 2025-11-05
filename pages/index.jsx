// pages/index.jsx
import FinanceApp from '../components/FinanceApp'

export default function Home() {
  // API_BASE пустой - Vercel автоматически использует тот же домен
  return <FinanceApp apiUrl="" />
}