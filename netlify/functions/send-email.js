exports.handler = async (event) => {
    // 1. CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: 'CORS Preflight successful.' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        console.log("1. Function started successfully.");

        const ip = event.headers['x-nf-client-connection-ip'] || 'unknown-ip';
        const redisUrl = process.env.UPSTASH_URL;
        const redisToken = process.env.UPSTASH_TOKEN;

        console.log("2. Checking Upstash Rate Limit...");
        const incrementRes = await fetch(`${redisUrl}/INCR/ratelimit:${ip}`, {
            headers: { Authorization: `Bearer ${redisToken}` }
        });
        
        const incrementData = await incrementRes.json();
        const count = incrementData.result;
        console.log(`3. This user has sent ${count} messages.`);

        if (count === 1) {
            await fetch(`${redisUrl}/EXPIRE/ratelimit:${ip}/3600`, {
                headers: { Authorization: `Bearer ${redisToken}` }
            });
        }

        if (count > 100) {
            console.log("4. Spammer blocked!");
            return { statusCode: 429, headers, body: JSON.stringify({ message: "You have sent too many messages. Please try again in an hour." }) };
        }

        console.log("5. Formatting payload for EmailJS...");
        const payload = JSON.parse(event.body);
        
        const emailjsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                template_params: {
                    user_name: payload.name,
                    user_email: payload.email,
                    message: payload.message
                }
            })
        });

        if (emailjsRes.ok) {
            console.log("6. SUCCESS! EmailJS accepted the message.");
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Message sent successfully!" }) };
        } else {
            // THIS TELLS US EXACTLY WHAT IS WRONG
            const errorText = await emailjsRes.text();
            console.error("7. EMAILJS REJECTED IT! Reason:", errorText);
            return { statusCode: 500, headers, body: JSON.stringify({ message: "Failed to send email." }) };
        }

    } catch (error) {
        console.error("8. Code Crashed:", error);
        return { statusCode: 500, headers, body: JSON.stringify({ message: "Server error occurred." }) };
    }
};