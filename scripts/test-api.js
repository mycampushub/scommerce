// Test API endpoints locally
const API_BASE = 'http://localhost:3000'

async function testAPI() {
  console.log('Testing /api/admin/stats...')

  try {
    const response = await fetch(`${API_BASE}/api/admin/stats`)
    const text = await response.text()
    console.log('Status:', response.status)
    console.log('Response:', text.substring(0, 500))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testAPI()
