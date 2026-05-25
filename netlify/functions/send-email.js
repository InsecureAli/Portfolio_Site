exports.handler = async (event) => {
    // 1. Set up the CORS headers (The "VIP Pass")
    const headers = {
        'Access-Control-Allow-Origin': '*', // Allows any domain to connect. You can change '*' to 'https://www.alih.shop' later for extra security.
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // 2. Handle the browser's Preflight security check
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS Preflight successful.' })
        };
    }

    // 3. Only allow POST requests for the actual form submission
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    const ip = event.headers['x-nf-client-connection-ip'] || 'unknown-ip';
    const redisUrl = process.env.UPSTASH_URL;
    const redisToken = process.env.UPSTASH_TOKEN;

    try {
        // 4. Check rate limit in Upstash Redis
        const incrementRes = await fetch(`${redisUrl}/INCR/ratelimit:${ip}`, {
            headers: { Authorization: `Bearer ${redisToken}` }
        });
        const incrementData = await incrementRes.json();
        const count = incrementData.result;

        // Set expiration for 1 hour on the first message
        if (count === 1) {
            await fetch(`${redisUrl}/EXPIRE/ratelimit:${ip}/3600`, {
                headers: { Authorization: `Bearer ${redisToken}` }
            });
        }

        // Block spammers
        if (count > 3) {
            return {
                statusCode: 429,
                headers, // <-- Notice we add headers to EVERY return statement now
                body: JSON.stringify({ message: "You have sent too many messages. Please try again in an hour." })
            };
        }

        // 5. Send to EmailJS
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

        // 6. Return success or failure
        if (emailjsRes.ok) {
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ message: "Message sent successfully!" }) 
            };
        } else {
            return { 
                statusCode: 500, 
                headers, 
                body: JSON.stringify({ message: "Failed to send email." }) 
            };
        }

    } catch (error) {
        console.error("Server Error:", error);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ message: "Server error occurred." }) 
        };
    }
};