// /api/chat.js - DeepSeek API 中转服务
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' });
  }

  try {
    const { messages, model = 'deepseek-chat' } = await req.body;
    
    // 从环境变量读取密钥（安全！）
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error('API密钥未配置，请在Vercel环境变量中设置DEEPSEEK_API_KEY');
    }

    // 调用DeepSeek官方API
    const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}` // 使用Bearer Token认证
      },
      body: JSON.stringify({
        model: model,       // 模型：deepseek-chat, deepseek-coder等
        messages: messages, // 对话历史
        stream: false       // 非流式响应，简单
      })
    });

    const data = await deepseekResponse.json();
    
    // 检查并返回结果
    if (data.choices && data.choices[0].message) {
      res.status(200).json({
        success: true,
        reply: data.choices[0].message.content // AI回复的文本
      });
    } else {
      throw new Error('API返回格式异常: ' + JSON.stringify(data));
    }

  } catch (error) {
    console.error('中转服务错误:', error);
    res.status(500).json({ 
      success: false, 
      message: 'AI服务调用失败',
      error: error.message 
    });
  }
}