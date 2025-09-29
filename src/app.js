import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// --- NEW DEPENDENCIES FOR PAYMENT ---
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

// --- FIXED: AUTOMATICALLY CREATE UPLOADS DIRECTORY ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use path.join for cross-platform compatibility
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure directory exists with better error handling
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log(`📁 Created uploads directory: ${uploadsDir}`);
    } else {
        console.log(`📁 Uploads directory already exists: ${uploadsDir}`);
    }
} catch (error) {
    console.error('❌ Error creating uploads directory:', error);
}
// --- END OF FIX ---

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
    },
});

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['customer', 'provider', 'admin']
    },
    address: {
        type: String,
        required: function() { return this.role === 'customer'; }
    },
    city: {
        type: String,
        required: function() { return this.role === 'customer'; }
    },
    pincode: {
        type: String,
        required: function() { return this.role === 'customer'; }
    },
    serviceType: {
        type: String,
        required: function() { return this.role === 'provider'; },
        enum: ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Painting',
               'Gardening', 'AC Repair', 'Appliance Repair', 'Home Maintenance', 'Other']
    },
    location: {
        type: String,
        required: function() { return this.role === 'provider'; }
    },
    hourlyRate: {
        type: Number,
        required: function() { return this.role === 'provider'; },
        min: 1
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    experience: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    availability: {
        type: Object,
        default: {
            monday: { available: false, startTime: '09:00', endTime: '18:00' },
            tuesday: { available: false, startTime: '09:00', endTime: '18:00' },
            wednesday: { available: false, startTime: '09:00', endTime: '18:00' },
            thursday: { available: false, startTime: '09:00', endTime: '18:00' },
            friday: { available: false, startTime: '09:00', endTime: '18:00' },
            saturday: { available: false, startTime: '09:00', endTime: '18:00' },
            sunday: { available: false, startTime: '09:00', endTime: '18:00' }
        }
    },
    skills: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    profileImage: { type: String, default: null },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, required: true },
    description: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    estimatedHours: { type: Number, required: true },
    address: { type: String, required: true },
    totalCost: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    // --- NEW: FIELDS FOR PAYMENT TRACKING ---
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    paymentDetails: {
        orderId: String,
        paymentId: String,
    },
    // --- END NEW FIELDS ---
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    comment: {
        type: String,
        default: ''
    },
    attachments: [{
        url: String,      // Path to the file
        filename: String, // Original name of the file
        mimetype: String  // Type of the file (e.g., 'image/png')
    }],
    reminderSent: {
        twentyFourHour: { type: Boolean, default: false },
        oneHour: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

bookingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

// --- 🚀 NEW: CHAT MESSAGE SCHEMA ---
const messageSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
// --- END OF CHAT MESSAGE SCHEMA ---

// Centralized Notification Logic
const sendNotificationToUser = (userId, payload) => {
    if (io) {
        console.log(`Sending notification to room ${userId}:`, payload);
        io.to(userId.toString()).emit('notification', payload);
    }
};

const broadcastNotification = (payload) => {
    if (io) {
        console.log(`Broadcasting notification to all users:`, payload);
        io.emit('notification', payload);
    }
};

// Socket.io Connection Handling
io.on('connection', (socket) => {
    console.log(`✅ A user connected: ${socket.id}`);

    socket.on('joinRoom', (userId) => {
        socket.join(userId);
        console.log(`🚪 User ${socket.id} joined notification room: ${userId}`);
    });

    socket.on('leaveRoom', (userId) => {
        socket.leave(userId);
        console.log(`🚪 User ${socket.id} left notification room: ${userId}`);
    });
    
    // --- 🚀 NEW: CHAT SOCKET EVENT HANDLERS ---
    socket.on('joinChatRoom', (bookingId) => {
        socket.join(bookingId);
        console.log(`💬 User ${socket.id} joined chat room: ${bookingId}`);
    });

    socket.on('leaveChatRoom', (bookingId) => {
        socket.leave(bookingId);
        console.log(`💬 User ${socket.id} left chat room: ${bookingId}`);
    });

    // Inside io.on('connection', ...) in your app.js

socket.on('sendMessage', async (data) => {
    try {
        const { bookingId, senderId, receiverId, text } = data;

        const message = new Message({
            bookingId,
            senderId,
            receiverId,
            text
        });
        await message.save();

        const populatedMessage = await Message.findById(message._id).populate('senderId', 'name');

        // This sends the message to everyone in the room EXCEPT the sender.
        socket.broadcast.to(bookingId).emit('receiveMessage', populatedMessage);
        
        // Send a notification to the receiver
        sendNotificationToUser(receiverId, {
            title: 'New Chat Message',
            message: `You have a new message from ${populatedMessage.senderId.name}.`
        });

    } catch (error) {
        console.error('Error handling sendMessage:', error);
    }
});
    // --- END OF CHAT SOCKET EVENT HANDLERS ---

    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
    });
});

// Automated Reminder Cron Job
cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running reminder check job...');
    const now = new Date();

    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const bookingsFor24hReminder = await Booking.find({
        status: 'confirmed',
        scheduledDate: { $lte: twentyFourHoursFromNow, $gt: now },
        'reminderSent.twentyFourHour': false
    });

    for (const booking of bookingsFor24hReminder) {
        sendNotificationToUser(booking.customerId, {
            title: 'Upcoming Service Reminder',
            message: `Your ${booking.serviceType} service is scheduled for tomorrow.`,
        });
        booking.reminderSent.twentyFourHour = true;
        await booking.save();
    }

    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const bookingsFor1hReminder = await Booking.find({
        status: 'confirmed',
        scheduledDate: { $lte: oneHourFromNow, $gt: now },
        'reminderSent.oneHour': false
    });

    for (const booking of bookingsFor1hReminder) {
        sendNotificationToUser(booking.customerId, {
            title: 'Service Reminder: Starting Soon',
            message: `Your ${booking.serviceType} service is scheduled to start in about an hour.`,
        });
        booking.reminderSent.oneHour = true;
        await booking.save();
    }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts' });

// --- FIXED: Multer Configuration with Absolute Paths ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use the absolute path to uploads directory
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        // Allow only images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
        }
    }
});

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

app.options('*', cors());
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- FIXED: Serve files with file existence check ---
app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${filePath}`);
        return res.status(404).json({ 
            success: false, 
            message: 'File not found' 
        });
    }
    
    next();
}, express.static(uploadsDir));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Access token is required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) return res.status(401).json({ success: false, message: 'User not found' });
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};

// Health check and Auth routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        console.log('Registration attempt for:', req.body.email);

        const {
            email,
            password,
            name,
            phoneNumber,
            role,
            address,
            city,
            pincode,
            serviceType,
            location,
            hourlyRate,
            experience,
            description,
            skills,
            certifications
        } = req.body;

        if (!email || !password || !name || !phoneNumber || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, name, phone number, and role are required'
            });
        }

        if (!['customer', 'provider'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either "customer" or "provider"'
            });
        }

        if (role === 'customer') {
            if (!address || !city || !pincode) {
                return res.status(400).json({
                    success: false,
                    message: 'Address, city, and pincode are required for customers'
                });
            }
        }

        if (role === 'provider') {
            if (!serviceType || !location || !hourlyRate) {
                return res.status(400).json({
                    success: false,
                    message: 'Service type, location, and hourly rate are required for providers'
                });
            }
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const userData = {
            email: email.toLowerCase(),
            password,
            name,
            phoneNumber,
            role
        };

        if (role === 'customer') {
            userData.address = address;
            userData.city = city;
            userData.pincode = pincode;
        } else if (role === 'provider') {
            userData.serviceType = serviceType;
            userData.location = location;
            userData.hourlyRate = parseInt(hourlyRate);
            userData.experience = experience || '';
            userData.description = description || '';
            userData.skills = skills ? skills.split(',').map(skill => skill.trim()) : [];
            userData.certifications = certifications ? certifications.split(',').map(cert => cert.trim()) : [];
        }

        const user = new User(userData);
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const userResponse = user.toObject();
        delete userResponse.password;

        console.log('✅ User registered successfully:', user.email);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        console.log('Login attempt for:', req.body.email);

        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (role && user.role !== role) {
            return res.status(401).json({
                success: false,
                message: `Invalid credentials for ${role} login`
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        const userResponse = user.toObject();
        delete userResponse.password;

        console.log('✅ User logged in successfully:', user.email);

        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => res.json({ success: true, message: 'Logout successful' }));

app.get('/api/auth/profile', authenticateToken, (req, res) => res.json({ success: true, user: req.user }));

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email, phoneNumber, serviceType, location, hourlyRate, experience, description, skills, certifications, city, pincode, address } = req.body;
        if (!name || !email || !phoneNumber) {
            return res.status(400).json({ success: false, message: 'Name, email, and phone number are required' });
        }
        if (req.user.role === 'provider') {
            if (!serviceType || !location || !hourlyRate) {
                return res.status(400).json({ success: false, message: 'Service type, location, and hourly rate are required for providers' });
            }
        }
        const updateData = { name, email: email.toLowerCase(), phoneNumber, updatedAt: Date.now() };
        if (req.user.role === 'provider') {
            updateData.serviceType = serviceType;
            updateData.location = location;
            updateData.hourlyRate = parseInt(hourlyRate);
            updateData.experience = experience || '';
            updateData.description = description || '';
            updateData.skills = skills ? skills : [];
            updateData.certifications = certifications ? certifications : [];
            updateData.city = city || '';
            updateData.pincode = pincode || '';
            updateData.address = address || '';
        }
        const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email is already in use by another account' });
        }
        const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true, runValidators: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

app.get('/api/providers', authenticateToken, async (req, res) => {
    try {
        const { serviceType, location, page = 1, limit = 10 } = req.query;
        const query = { role: 'provider', isActive: true };
        if (serviceType) query.serviceType = serviceType;
        if (location) query.location = { $regex: location, $options: 'i' };
        const providers = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
        const total = await User.countDocuments(query);
        res.json({ success: true, providers, totalPages: Math.ceil(total / limit), currentPage: page, total });
    } catch (error) {
        console.error('Providers fetch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching providers' });
    }
});

// --- FIXED: Booking Creation with File Cleanup ---
app.post('/api/bookings', authenticateToken, upload.array('attachments', 5), async (req, res) => {
    try {
        const { providerId, serviceType, description, scheduledDate, scheduledTime, estimatedHours, address, totalCost } = req.body;
        
        if (!providerId || !serviceType || !description || !scheduledDate || !scheduledTime || !estimatedHours || !address || !totalCost) {
            // Clean up uploaded files if validation fails
            if (req.files) {
                req.files.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                        console.log(`🧹 Cleaned up file: ${file.path}`);
                    } catch (error) {
                        console.error('Error cleaning up file:', error);
                    }
                });
            }
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const provider = await User.findOne({ _id: providerId, role: 'provider' });
        if (!provider) {
            // Clean up uploaded files if provider not found
            if (req.files) {
                req.files.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                        console.log(`🧹 Cleaned up file: ${file.path}`);
                    } catch (error) {
                        console.error('Error cleaning up file:', error);
                    }
                });
            }
            return res.status(404).json({ success: false, message: 'Provider not found' });
        }

        const attachments = req.files ? req.files.map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.originalname,
            mimetype: file.mimetype
        })) : [];

        const booking = new Booking({
            customerId: req.user._id,
            providerId,
            serviceType,
            description,
            scheduledDate,
            scheduledTime,
            estimatedHours,
            address,
            totalCost,
            attachments
        });
        
        await booking.save();
        
        sendNotificationToUser(providerId, { 
            title: 'New Service Request', 
            message: `You have a new booking request from ${req.user.name} for ${serviceType}.` 
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'Booking created successfully', 
            booking 
        });
        
    } catch (error) {
        // Clean up uploaded files if error occurs
        if (req.files) {
            req.files.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                    console.log(`🧹 Cleaned up file due to error: ${file.path}`);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            });
        }
        
        console.error('Booking creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating booking' 
        });
    }
});

app.get('/api/bookings/customer', authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ customerId: req.user._id }).populate('providerId', 'name').sort({ scheduledDate: -1 });
        // --- NEW: INCLUDE PAYMENT STATUS IN RESPONSE ---
        res.json({
            success: true,
            bookings: bookings.map(b => ({
                _id: b._id,
                providerId: b.providerId._id, // Pass providerId for chat
                serviceType: b.serviceType,
                description: b.description,
                scheduledDate: b.scheduledDate,
                scheduledTime: b.scheduledTime,
                estimatedHours: b.estimatedHours,
                address: b.address,
                totalCost: b.totalCost,
                status: b.status,
                rating: b.rating,
                comment: b.comment,
                providerName: b.providerId ? b.providerId.name : 'N/A',
                attachments: b.attachments || [],
                paymentStatus: b.paymentStatus // Send payment status to frontend
            }))
        });
    } catch (error) {
        console.error('Fetch bookings error:', error);
        res.status(500).json({ success: false, message: 'Error fetching bookings' });
    }
});

app.put('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user._id });
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending bookings can be cancelled' });
        booking.status = 'cancelled';
        await booking.save();
        sendNotificationToUser(booking.providerId, { 
            title: 'Booking Cancelled', 
            message: `Your booking for ${booking.serviceType} on ${new Date(booking.scheduledDate).toLocaleDateString()} has been cancelled by the customer.` 
        });
        res.json({ success: true, message: 'Booking cancelled' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ success: false, message: 'Error cancelling booking' });
    }
});

app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        if (req.user.role !== 'provider') {
            return res.status(403).json({ success: false, message: 'Only providers can update booking status.' });
        }
        const booking = await Booking.findOne({ _id: req.params.id, providerId: req.user._id });
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (!['confirmed', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        booking.status = status;
        await booking.save();
        let notificationPayload = {};
        switch (status) {
            case 'confirmed':
                notificationPayload = { title: 'Booking Confirmed!', message: `Your service with ${req.user.name} has been confirmed.` };
                break;
            case 'in-progress':
                notificationPayload = { title: 'Service In Progress', message: `${req.user.name} has started your service.` };
                break;
            case 'completed':
                notificationPayload = { title: 'Service Completed!', message: `Your service is complete. Please make the payment and consider leaving a rating.` };
                break;
            case 'cancelled':
                notificationPayload = { title: 'Booking Cancelled by Provider', message: `Your booking with ${req.user.name} has been cancelled.` };
                break;
        }
        if (notificationPayload.title) {
            sendNotificationToUser(booking.customerId, notificationPayload);
        }
        res.json({ success: true, message: `Booking ${status} successfully` });
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({ success: false, message: 'Error updating booking status' });
    }
});

app.post('/api/bookings/:id/rate', authenticateToken, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
        }
        const booking = await Booking.findOne({ _id: bookingId, customerId: req.user._id });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or you are not authorized to rate this booking' });
        }
        if (booking.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Only completed bookings can be rated' });
        }
        if (booking.rating !== null) {
            return res.status(400).json({ success: false, message: 'This booking has already been rated' });
        }
        booking.rating = rating;
        booking.comment = comment || '';
        await booking.save();
        const providerBookings = await Booking.find({ providerId: booking.providerId, rating: { $ne: null } });
        const averageRating = providerBookings.length > 0 ? providerBookings.reduce((sum, b) => sum + b.rating, 0) / providerBookings.length : 0;
        await User.findByIdAndUpdate(booking.providerId, { rating: averageRating.toFixed(2) }, { new: true });
        res.status(200).json({ success: true, message: 'Rating submitted successfully', booking });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ success: false, message: 'Error submitting rating' });
    }
});

app.get('/api/bookings/provider', authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ providerId: req.user._id }).populate('customerId', 'name').sort({ scheduledDate: -1 });
        res.json({
            success: true,
            bookings: bookings.map(b => ({
                _id: b._id,
                customerId: b.customerId._id, // Pass customerId for chat
                serviceType: b.serviceType,
                status: b.status,
                customerName: b.customerId ? b.customerId.name : 'N/A',
                scheduledDate: b.scheduledDate,
                scheduledTime: b.scheduledTime,
                totalCost: b.totalCost,
                estimatedHours: b.estimatedHours,
                address: b.address,
                description: b.description,
                rating: b.rating,
                comment: b.comment,
                attachments: b.attachments || [],
                paymentStatus: b.paymentStatus // Send payment status to provider
            }))
        });
    } catch (error) {
        console.error('Fetch provider bookings error:', error);
        res.status(500).json({ success: false, message: 'Error fetching bookings' });
    }
});

app.put('/api/bookings/:id/reschedule', authenticateToken, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { scheduledDate, scheduledTime } = req.body;
        if (!scheduledDate || !scheduledTime) {
            return res.status(400).json({ success: false, message: 'Scheduled date and time are required' });
        }
        const today = new Date();
        const newDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        if (newDateTime < today) {
            return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date and time' });
        }
        const booking = await Booking.findOne({ _id: bookingId, customerId: req.user._id });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found or you are not authorized' });
        }
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({ success: false, message: 'Only pending or confirmed bookings can be rescheduled' });
        }
        booking.scheduledDate = scheduledDate;
        booking.scheduledTime = scheduledTime;
        await booking.save();
        res.status(200).json({ success: true, message: 'Booking rescheduled successfully', booking });
    } catch (error) {
        console.error('Reschedule booking error:', error);
        res.status(500).json({ success: false, message: 'Error rescheduling booking' });
    }
});

// --- 🚀 NEW: CHAT HISTORY API ROUTE ---
app.get('/api/chat/:bookingId/messages', authenticateToken, async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Check if user is part of the booking
        const booking = await Booking.findById(bookingId);
        if (!booking || (booking.customerId.toString() !== req.user._id.toString() && booking.providerId.toString() !== req.user._id.toString())) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to this chat.' });
        }

        const messages = await Message.find({ bookingId })
            .sort({ createdAt: 'asc' })
            .populate('senderId', 'name'); // Populate sender's name

        res.status(200).json({ success: true, messages });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ success: false, message: 'Error fetching chat history.' });
    }
});
// --- END OF CHAT HISTORY ROUTE ---

// --- NEW: RAZORPAY PAYMENT ROUTES ---
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/payment/create-order', authenticateToken, async (req, res) => {
    try {
        const { amount, currency, bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'This booking has already been paid for.' });
        }

        const options = {
            amount: amount, // amount in the smallest currency unit (paisa)
            currency: currency,
            receipt: `receipt_booking_${bookingId}`,
        };

        const order = await razorpay.orders.create(options);
        if (!order) {
            return res.status(500).json({ message: 'Error creating Razorpay order.' });
        }

        res.status(200).json({ order });

    } catch (error) {
        console.error('Error in /create-order:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/api/payment/verify-payment', authenticateToken, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body;

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: 'paid',
                paymentDetails: {
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                },
            });

            res.status(200).json({ success: true, message: 'Payment verified successfully.' });
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }
    } catch (error) {
        console.error('Error in /verify-payment:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
// --- END OF PAYMENT ROUTES ---


// Admin and provider-specific routes
app.post('/api/admin/broadcast', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { title, message } = req.body;
    if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }
    broadcastNotification({ title, message });
    res.status(200).json({ success: true, message: 'Promotional message broadcasted to all users.' });
});

app.put('/api/providers/availability', authenticateToken, async (req, res) => {
    try {
        const { availability } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.user._id, { availability }, { new: true, runValidators: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'Availability updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ success: false, message: 'Error updating availability' });
    }
});

app.get('/api/earnings/provider', authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ providerId: req.user._id, status: 'completed' });
        const total = bookings.reduce((sum, b) => sum + b.totalCost, 0);
        const thisMonth = bookings.filter(b => new Date(b.scheduledDate).getMonth() === new Date().getMonth()).reduce((sum, b) => sum + b.totalCost, 0);
        const pending = await Booking.countDocuments({ providerId: req.user._id, status: 'pending' }) * 100; // Adjust logic
        res.json({ success: true, earnings: { total, thisMonth, pending } });
    } catch (error) {
        console.error('Fetch earnings error:', error);
        res.status(500).json({ success: false, message: 'Error fetching earnings' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalProviders = await User.countDocuments({ role: 'provider' });
        const activeUsers = await User.countDocuments({ isActive: true });
        res.json({ success: true, stats: { totalUsers, totalCustomers, totalProviders, activeUsers } });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

// Error handling and server start
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'Internal server error', 
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
});

app.use('*', (req, res) => {
    console.log('404 - Route not found:', req.method, req.originalUrl);
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/homeservices';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, '0.0.0.0', () => {
            console.log('🚀 Server starting...');
            console.log(`✅ Server with Real-Time Notifications running on: http://localhost:${PORT}`);
            console.log(`🔍 Health check: http://localhost:${PORT}/health`);
            console.log(`📁 Uploads directory: ${uploadsDir}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;