const OpenAI = require('openai');
require('dotenv').config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10,
    });
    console.log('✅ SUCCESS:', response.choices[0].message.content);
  } catch (error) {
    console.log('❌ ERROR:', error.code, error.message);
  }
}

test();