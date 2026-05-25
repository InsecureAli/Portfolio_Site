exports.handler = async (event) => {
    // 1. Only allow POST requests (security measure)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. Get the user's IP address from Netlify's headers
    const ip = event.headers['x-nf-client-connection-ip'] || 'unknown-ip';
    
    // Grab the Environment Variables you set in Netlify
    const redisUrl = process.env.UPSTASH_URL;
    const redisToken = process.env.UPSTASH_TOKEN;

    try {
        // 3. Check rate limit in Upstash Redis
        // Increment the count for this specific IP address
        const incrementRes = await fetch(`${redisUrl}/INCR/ratelimit:${ip}`, {
            headers: { Authorization: `Bearer ${redisToken}` }
        });
        const incrementData = await incrementRes.json();
        const count = incrementData.result;

        // If it's their very first message, set the database key to expire in 1 hour (3600 seconds)
        if (count === 1) {
            await fetch(`${redisUrl}/EXPIRE/ratelimit:${ip}/3600`, {
                headers: { Authorization: `Bearer ${redisToken}` }
            });
        }

        // 4. If they have sent more than 3 messages, block the request!
        if (count > 3) {
            return {
                statusCode: 429,
                body: JSON.stringify({ message: "You have sent too many messages. Please try again in an hour." })
            };
        }

        // 5. If they passed the spam check, parse the form data
        const payload = JSON.parse(event.body);
        
        // 6. Send the email securely using the EmailJS REST API
        const emailjsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                template_params: {
                    user_name: payload.name,     // Matches the {{user_name}} in your EmailJS template
                    user_email: payload.email,   // Matches the {{user_email}} in your EmailJS template
                    message: payload.message     // Matches the {{message}} in your EmailJS template
                }
            })
        });

        // 7. Tell the frontend if the email succeeded or failed
        if (emailjsRes.ok) {
            return { statusCode: 200, body: JSON.stringify({ message: "Message sent successfully!" }) };
        } else {
            return { statusCode: 500, body: JSON.stringify({ message: "Failed to send email." }) };
        }

    } catch (error) {
        console.error("Server Error:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Server error occurred." }) };
    }
};