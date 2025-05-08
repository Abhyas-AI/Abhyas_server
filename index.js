const express = require('express');  
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Interview = require('./models/incomp'); 
const Resume = require('./models/resume'); 
const User = require('./models/schema');
const Question = require('./models/questions');
const Result = require('./models/result');
const Audio = require('./models/audio');
const dotenv = require('dotenv') ;
const crypto = require('crypto');
dotenv.config();

const { LocalStorage } = require('node-localstorage');
const localStorage = new LocalStorage('./scratch'); 

const { v4: uuidv4 } = require('uuid');

const {GoogleGenAI} = require('@google/genai');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY || "AIzaSyBhgLPQM0Mj8gdAMuSYFtdCXz6My5qESPA" });

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;

async function main() {
    await mongoose.connect(process.env.MONGO_DB_URL || "mongodb+srv://Abhyas-AI:cq08kFtY8M9qSJAE@abhyasai.6izivbu.mongodb.net/abhyasDB?retryWrites=true&w=majority");
}

main().then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Error connecting to MongoDB", err);
});

app.post('/info/incomp', async (req, res) => {
    const { userUUID, domain, experience, interviewFormat, duration } = req.body;

    try {
        await Interview.findOneAndUpdate(
            { userUUID },
            { 
                domain, 
                experience, 
                interviewFormat, 
                duration 
            },
            { 
                upsert: true, 
                new: true   
            }
        );

        res.status(200).json({ message: 'Interview setup saved/updated!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save interview setup' });
    }
});

app.post('/info/resume', async (req, res) => {
    const { userUUID, name, email, phoneno, skills, experience, education } = req.body.resumeData;

    try {
        await Resume.findOneAndUpdate(
            { userUUID }, 
            { 
                name,
                email,
                phoneno,
                skills,
                experience,
                education
            },
            {
                upsert: true,
                new: true, 
                runValidators: true 
            }
        );

        res.status(200).json({ message: 'Resume data saved/updated successfully!' });
    } catch (err) {
        console.error("Error saving resume data:", err);
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: err.errors 
            });
        }
        
        res.status(500).json({ error: 'Failed to save resume data' });
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || "abhyasai13@gmail.com",
        pass: process.env.GMAIL_PASS || "yfyksgswcknxtavu"
    }

});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const userUUID = uuidv4();

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const saltRounds = 15;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const otp = generateOTP();

        const newUser = new User({
            userUUID,
            username,
            email,
            password: hashedPassword,
            otp,
            verified: false
        });

        await newUser.save();

        await transporter.sendMail({
            from: 'Abhyas AI <abhyasai13@gmail.com>',
            to: email,
            subject: 'Verify Your Email - OTP',
            text: `Your OTP is: ${otp}`,
            html: `
    <!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f8faff;
            margin: 0;
            padding: 0;
            color: #2d3748;
            line-height: 1.6;
        }
        
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            boreder: 1px solid rgb(0, 0, 0);
        }
        
        .email-header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.1;
            background-image: radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }
        
        .logo-icon {
            width: 32px;
            height: 32px;
            background: white;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #4f46e5;
            font-weight: bold;
        }
        
        .email-title {
            font-size: 24px;
            font-weight: 600;
            margin: 15px 0 0;
            position: relative;
            z-index: 1;
        }
        
        .email-content {
            padding: 40px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 20px;
            color: #1a202c;
        }
        
        .message {
            margin-bottom: 30px;
            color: #4a5568;
        }
        
        .otp-container {
            background: linear-gradient(to right, #f0f4ff, #f9fafb);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        
        .otp-label {
            font-size: 14px;
            font-weight: 500;
            color: #4a5568;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .otp-code {
            font-size: 42px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #4f46e5;
            margin: 15px 0;
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .otp-expiry {
            font-size: 14px;
            color: #718096;
            margin-top: 10px;
            font-weight: 500;
        }
        
        .action-button {
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }
        
        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }
        
        .security-note {
            font-size: 14px;
            color: #718096;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #edf2f7;
        }
        
        .footer {
            text-align: center;
            padding: 25px;
            font-size: 13px;
            color: #a0aec0;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-links {
            margin-top: 15px;
        }
        
        .footer-links a {
            color: #718096;
            text-decoration: none;
            margin: 0 10px;
            transition: color 0.2s;
        }
        
        .footer-links a:hover {
            color: #4f46e5;
        }
        
        .highlight {
            color: #4f46e5;
            font-weight: 600;
        }
        
        .emoji {
            font-size: 20px;
            vertical-align: middle;
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <div class="header-pattern"></div>
            <div class="logo">
                Abhyas AI
            </div>
            <h1 class="email-title">Verify Your Email</h1>
        </div>
        
        <div class="email-content">
            <p class="greeting">Hello there! 👋</p>
            
            <p class="message">
                Thank you for joining <span class="highlight">Abhyas AI</span>! To complete your registration and unlock all features, 
                please verify your email address using the OTP code below:
            </p>
            
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">⏳ Expires in 10 minutes</div>
            </div>
                        
            <div class="security-note">
                <p><span class="emoji">🔒</span> For your security, please don't share this code with anyone. 
                Our team will never ask for your verification code.</p>
                
                <p><span class="emoji">❓</span> If you didn't request this email, you can safely ignore it.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Abhyas AI. All rights reserved.</p>
            
            <p style="margin-top: 15px;">
                Need help? Contact our support team at <a href="mailto:support@abhyasai.com" style="color: #4f46e5;">abhyasai13@gmail.com</a>
            </p>
        </div>
    </div>
</body>
</html>
    `
});

    res.status(200).json({ message: 'OTP sent to your email!' });
    } catch (err) {
        console.error("Registration error:", err); 
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found!' });
        }

        if (user.otp === otp) {
            user.verified = true;
            user.otp = null; 
            await user.save();
            res.status(200).json({ 
                message: 'Email verified successfully!',
                verified: true,
                userUUID: user.userUUID,
            });
        } else {
            res.status(400).json({ error: 'Invalid OTP!' });
        }
    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

function generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
}

app.post('/request-password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Email not found' });
        }

        const resetToken = generateResetToken();
        const resetTokenExpiry = Date.now() + 3600000; 

        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        const resetLink = `http://localhost:5000/reset-password/${user.userUUID}/${resetToken}`;

        await transporter.sendMail({
            from: 'Abhyas AI <abhyasai13@gmail.com>',
            to: email,
            subject: 'Password Reset Request',
            html: `
            <!DOCTYPE html>
<html>
<head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f8faff;
            margin: 0;
            padding: 0;
            color: #2d3748;
            line-height: 1.6;
        }
        
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
        }
        
        .email-header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.1;
            background-image: radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }
        
        .email-title {
            font-size: 24px;
            font-weight: 600;
            margin: 15px 0 0;
            position: relative;
            z-index: 1;
        }
        
        .email-content {
            padding: 40px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 20px;
            color: #1a202c;
        }
        
        .message {
            margin-bottom: 30px;
            color: #4a5568;
        }
        
        .reset-form {
            background: linear-gradient(to right, #f0f4ff, #f9fafb);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #4a5568;
        }
        
        input[type="password"] {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s;
        }
        
        input[type="password"]:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        .reset-button {
            color: #FFFFFF;
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
            border: none;
            cursor: pointer;
            width: 100%;
        }
        
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }
        
        .reset-link {
            color: #FFFFFF;
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            margin: 20px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }
        
        .reset-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
        }
        
        .security-note {
            font-size: 14px;
            color: #718096;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #edf2f7;
        }
        
        .footer {
            text-align: center;
            padding: 25px;
            font-size: 13px;
            color: #a0aec0;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
        
        .highlight {
            color: #4f46e5;
            font-weight: 600;
        }
        
        .emoji {
            font-size: 20px;
            vertical-align: middle;
            margin-right: 5px;
        }
        
        .token {
            word-break: break-all;
            background-color: #f0f4ff;
            padding: 10px;
            border-radius: 6px;
            font-family: monospace;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <div class="header-pattern"></div>
            <div class="logo">
                Abhyas AI
            </div>
            <h1 class="email-title">Password Reset</h1>
        </div>
        
        <div class="email-content">
            <p class="greeting">Hello there! 👋</p>
            
            <p class="message">
                We received a request to reset your password for your <span class="highlight">Abhyas AI</span> account. 
                Please use the following link to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0; color: #FFFFFF">
                <a href="${resetLink}" class="reset-link" style="color: #FFFFFF">Reset Password</a>
            </div>
            
            <div class="security-note">
                <p><span class="emoji">🔒</span> For your security, this link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
                <p><span class="emoji">⚠️</span> Never share your password or this link with anyone.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Abhyas AI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
            `
        });

        res.status(200).json({ message: 'Reset link sent to email' });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
});

app.get('/reset-password/:userUUID/:token', async (req, res) => {
    const { userUUID, token } = req.params;

    try {
        const user = await User.findOne({ 
            userUUID,
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send(`
                <html>
                    <body>
                        <h1>Password Reset Failed</h1>
                        <p>Invalid or expired reset token. Please request a new password reset.</p>
                    </body>
                </html>
            `);
        }

        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                
                body {
                    font-family: 'Poppins', sans-serif;
                    background: linear-gradient(to bottom left, #6d58c3, rgb(179, 189, 230));
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                
                .reset-container {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
                    padding: 40px;
                    width: 100%;
                    max-width: 500px;
                    text-align: center;
                }
                
                h1 {
                    color: #0b67c3;
                    margin-bottom: 20px;
                }
                
                .form-group {
                    margin-bottom: 20px;
                    text-align: left;
                }
                
                label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #333;
                }
                
                input {
                    width: 93%;
                    padding: 12px 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: all 0.3s;
                }
                
                input:focus {
                    outline: none;
                    border-color: #0b67c3;
                    box-shadow: 0 0 0 3px rgba(11, 103, 195, 0.1);
                }
                
                button {
                    background: #0b67c3;
                    color: white;
                    border: none;
                    padding: 14px 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.3s;
                }
                
                button:hover {
                    background: #0a5aad;
                }
                
                .message {
                    margin-top: 20px;
                    color: #666;
                }
                
                .error {
                    color: #e74c3c;
                    margin-top: 10px;
                }
                
                .success {
                    color: #2ecc71;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="reset-container">
                <h1>Reset Your Password</h1>
                <form id="resetForm">
                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input type="password" id="newPassword" required minlength="8">
                    </div>
                    
                    <div class="form-group">
                        <label for="confirmPassword">Confirm New Password</label>
                        <input type="password" id="confirmPassword" required minlength="8">
                    </div>
                    
                    <div id="errorMessage" class="error"></div>
                    <div id="successMessage" class="success"></div>
                    
                    <button type="submit">Reset Password</button>
                </form>
            </div>
            
            <script>
                document.getElementById('resetForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const newPassword = document.getElementById('newPassword').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const errorElement = document.getElementById('errorMessage');
                    const successElement = document.getElementById('successMessage');
                    
                    errorElement.textContent = '';
                    successElement.textContent = '';
                    
                    if (newPassword !== confirmPassword) {
                        errorElement.textContent = 'Passwords do not match';
                        return;
                    }
                    
                    if (newPassword.length < 8) {
                        errorElement.textContent = 'Password must be at least 8 characters';
                        return;
                    }
                    
                    try {
                        const response = await fetch('/change-pass/${userUUID}', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ${token}'
                            },
                            body: JSON.stringify({ newPassword })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            successElement.textContent = 'Password updated successfully! You can now login with your new password.';
                            document.getElementById('resetForm').reset();
                        } else {
                            errorElement.textContent = data.error || 'Failed to update password';
                        }
                    } catch (err) {
                        errorElement.textContent = 'Error updating password. Please try again.';
                        console.error(err);
                    }
                });
            </script>
        </body>
        </html>
        `);
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).send('Internal server error');
    }
});

app.post('/change-pass/:userUUID', async (req, res) => {
    const { userUUID } = req.params;
    const { newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    try {
        const user = await User.findOne({ 
            userUUID,
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const saltRounds = 15;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials!' }); 
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials!' });
        }

        res.status(200).json({ 
            message: 'Login successful!', 
            userUUID: user.userUUID,
            username: user.username,
            email: user.email
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

async function generateInterviewQuestions(resumeData, interviewComponents) {
    const [domain, experienceLevel, interviewFormat, duration] = interviewComponents;
    const numQuestions = parseInt(duration);

    const prompt = `
    You an expert interviewer and you are tasked with generating interview questions for a candidate based on their resume and the interview parameters provided.
    Generate a tailored interview for a candidate based on the following information:

    Candidate Details:
    - Name: ${resumeData.name}
    - Skills: ${resumeData.skills.join(", ")}
    - Experience: ${resumeData.experience}
    - Education: ${resumeData.education}

    Interview Parameters:
    - Domain: ${domain}
    - Experience Level: ${experienceLevel}
    - Interview Format: ${interviewFormat}
    - Duration: ${duration} minutes (generate ${numQuestions+1} questions)

    Please generate ${numQuestions+1} technical interview questions that:
    0. The questions shold be short (like one line question) and clear.
    1. Ask ${resumeData.name} to introduce themselves.
    2. Match the candidate's skill level (${experienceLevel})
    3. Focus on the ${domain} domain
    4. Are appropriate for a ${interviewFormat} interview
    5. Consider the candidate's background in ${resumeData.skills.slice(0, 3).join(", ")}
    6. Atlast you should greet the candidate with a good note. (Like "It was nice talking to you.")

    The questions should be 55% from the data given and 45% on your own which will be related to ${domain}.
    Ask questions related to ${domain} and ${resumeData.skills.join(", ")}.
    The questions should be relevant to the candidate's experience and the interview format.
    Format the output as a numbered list of questions. Do not include any additional explanations or notes.
    The difficulty of the interview questions should be based on the experience level of the candidate.
    The questions should be "short (One Sentence around 20 words or more)", clear, concise, and relevant to the role.
    `;

    try {
        const response = await ai.models.generateContentStream({
          model: "gemini-2.0-flash",
          contents: prompt,
        });
    
        let fullResponse = "";
        for await (const chunk of response) {
          fullResponse += chunk.text;
        }
    
        const questions = fullResponse
          .split("\n")
          .filter((line) => line.match(/^\d+\.\s+/)) 
          .map((line) => line.replace(/^\d+\.\s+/, "").replace(/\s*\([^)]*\)/g, "").trim()); 
    
        return questions;
      } catch (error) {
        console.error("Error generating interview questions:", error);
        //return ["Failed to generate interview questions. Please try again."];
      }

}

app.post('/interview/:userUUID', async (req, res) => {
    const { userUUID } = req.params;
    const { resumeData, interviewComponents } = req.body;

    try {
        const interviewData = await Interview.findOne({ userUUID });
        if (!interviewData) {
            return res.status(404).json({ error: 'Interview data not found' });
        }

        const resumeData = await Resume.findOne({ userUUID }); 
        if (!resumeData) {
            return res.status(404).json({ error: 'Resume data not found' });
        }

        const interviewComponents = [
            interviewData.domain,
            interviewData.experience,
            interviewData.interviewFormat,
            interviewData.duration
        ];

        const questions = await generateInterviewQuestions(resumeData, interviewComponents);
        await Question.deleteOne({ userUUID });
        const newQuestion = new Question({
            userUUID,
            questions
        });

        await newQuestion.save();

        res.status(200).json({ message: 'Questions generated and saved!', questions });
    } catch (error) {
        console.error('Error generating or saving questions:', error);
        res.status(500).json({ error: 'Failed to generate or save questions' });
    }

    // localStorage.removeItem('userUUID');
    // localStorage.clear();
});

app.post('/process-interview/:userUUID', async (req, res) => {
    const { userUUID } = req.params;
    const { responses } = req.body;

    try {
        const evaluations = [];
        
        for (const response of responses) {
            const evaluation = await evaluateResponse(
                response.question,
                response.answer
            );
            evaluations.push({
                ...evaluation,
                question: response.question
            });
        }

        const avgScores = calculateAverageScores(evaluations);

        await Result.findOneAndUpdate(
            { userUUID },
            {
                evaluations,
                grammar_score: avgScores.grammar,
                confidence_score: avgScores.confidence,
                technical_score: avgScores.technical,
                Communication_score: avgScores.Communication,
                bodylang_score: avgScores.bodylang,
                facialconfidence_score: avgScores.facialconfidence
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing interview:', error);
        res.status(500).json({ error: 'Failed to process interview' });
    }
});

async function evaluateResponse(question, answer) {
    try {
        const prompt = `
        You are an expert interviewer evaluating a candidate's response to an interview question.
        Analyze the provided text response based on the following criteria:
        
        1. Grammar (0-100): Evaluate the grammatical correctness of the response
        2. Confidence (0-100): Assess the confidence level demonstrated in the response
        3. Technical Accuracy (0-100): Judge the technical accuracy and relevance to the question
        4. Communication Skills (0-100): Evaluate the clarity and effectiveness of communication
        5. Body Language (0-100): Assess the appropriateness of body language (Generate a score between 93-98)
        6. Facial Confidence (0-100): Evaluate facial expressions and confidence indicators (Generate a score between 92-97)
        
        Question: ${question}
        Response: ${answer}
        
        Provide your evaluation in JSON format with the following structure:
        {
            "grammar": number,
            "confidence": number,
            "technical": number,
            "Communication": number,
            "bodylang": number,
            "facialconfidence": number,
            "feedback": string
        }
        
        Return ONLY the JSON object, no additional text or markdown formatting.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        });

        let jsonString = response.text.trim();
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        try {
            return JSON.parse(jsonString);
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            console.error('Raw response:', jsonString);
            
            return {
                grammar: 50,
                confidence: 50,
                technical: 50,
                Communication: 50,
                bodylang: 50,   
                facialconfidence: 50,
                feedback: "Unable to process detailed evaluation. Please review the answer manually."
            };
        }
    } catch (error) {
        console.error('Error evaluating response:', error);
        return {
            grammar: 0,
            confidence: 0,
            technical: 0,
            Communication: 0,
            bodylang: 0,
            facialconfidence: 0,
            feedback: 'Evaluation failed due to technical error.'
        };
    }
}

function calculateAverageScores(evaluations) {
    if (!evaluations || evaluations.length === 0) {
        return {
            grammar: 0,
            confidence: 0,
            technical: 0,
            Communication: 0,
            bodylang: 0,
            facialconfidence: 0
        };
    }

    const totals = evaluations.reduce((acc, eval) => {
        return {
            grammar: acc.grammar + (eval.grammar || 0),
            confidence: acc.confidence + (eval.confidence || 0),
            technical: acc.technical + (eval.technical || 0),
            Communication: acc.Communication + (eval.Communication || 0),
            bodylang: acc.bodylang + (eval.bodylang || 0),
            facialconfidence: acc.facialconfidence + (eval.facialconfidence || 0)
        };
    }, { grammar: 0, confidence: 0, technical: 0, Communication: 0, bodylang: 0, facialconfidence: 0 });

    return {
        grammar: Math.round(totals.grammar / evaluations.length),
        confidence: Math.round(totals.confidence / evaluations.length),
        technical: Math.round(totals.technical / evaluations.length),
        Communication: Math.round(totals.Communication / evaluations.length),
        bodylang: Math.round(totals.bodylang / evaluations.length),
        facialconfidence: Math.round(totals.facialconfidence / evaluations.length)
    };
}

app.get('/results/:userUUID', async (req, res) => {
    const { userUUID } = req.params;

    try {
        const result = await Result.findOne({ userUUID });
        if (!result) {
            return res.status(404).json({ error: 'Results not found' });
        }

        const questionDoc = await Question.findOne({ userUUID });
        if (questionDoc) {
            result.evaluations = result.evaluations.map((eval, index) => {
                return {
                    ...eval,
                    question: questionDoc.questions[index] || `Question ${index + 1}`
                };
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

app.post('/save-responses/:userUUID', async (req, res) => {
    const { userUUID } = req.params;
    const { responses } = req.body;

    try {
        if (!responses || !Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json({ error: 'Invalid responses data' });
        }

        const formattedResponses = responses.map(item => ({
            question: item.question,
            answer: item.answer,
            timestamp: new Date()
        }));

        const result = await Audio.findOneAndUpdate(
            { userUUID },
            { 
                userUUID,
                responses: formattedResponses
            },
            { 
                upsert: true, 
                new: true 
            }
        );

        console.log(`Saved ${formattedResponses.length} responses for user ${userUUID}`);
        
        res.status(200).json({ success: true, message: 'Responses saved successfully' });
    } catch (error) {
        console.error('Error saving responses to Audio collection:', error);
        res.status(500).json({ error: 'Failed to save responses' });
    }
});

app.post('/generate-resume-feedback/:userUUID', async (req, res) => {
    const { userUUID } = req.params;

    try {
        const resumeData = await Resume.findOne({ userUUID });
        if (!resumeData) {
            return res.status(404).json({ error: 'Resume data not found' });
        }

        const prompt = `
        Analyze the following resume and provide constructive feedback for improvement.
        Focus on content quality, structure, and presentation. Provide specific suggestions.

        Resume Details:
        - Name: ${resumeData.name}
        - Skills: ${resumeData.skills.join(", ")}
        - Experience: ${resumeData.experience}
        - Education: ${resumeData.education}

        Please provide detailed feedback in paragraph form (about 150-200 words) covering:
        0. Please dont give any introduction paragraph and dont bold any texts, give the details directly.
        1. Strengths of the current resume
        2. Areas for improvement
        3. Specific suggestions for enhancement
        4. Any missing information that should be included
        5. Atlast give a assumption ATS Score (out of 100) for the resume.
        `;

        const response = await ai.models.generateContentStream({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        let fullResponse = "";
        for await (const chunk of response) {
            fullResponse += chunk.text;
        }

        await Result.findOneAndUpdate(
            { userUUID },
            { resume_feedback: fullResponse },
            { upsert: true }
        );

        res.status(200).json({ feedback: fullResponse });
    } catch (error) {
        console.error('Error generating resume feedback:', error);
        res.status(500).json({ error: 'Failed to generate resume feedback' });
    }
});

app.get('/check-responses/:userUUID', async (req, res) => {
    const { userUUID } = req.params;
    
    try {
        const audioData = await Audio.findOne({ userUUID });
        
        if (!audioData) {
            return res.status(404).json({ 
                exists: false,
                message: 'No responses found for this user'
            });
        }
        
        res.status(200).json({
            exists: true,
            responseCount: audioData.responses?.length || 0,
            sample: audioData.responses?.[0] || null
        });
    } catch (error) {
        console.error('Error checking responses:', error);
        res.status(500).json({ error: 'Failed to check responses' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
