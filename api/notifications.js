// CRS Notification Service - SMS & Email
// Practical customer communication system

const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

// Initialize services
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// CRS Business Phone
const CRS_PHONE = process.env.TWILIO_PHONE_NUMBER || '+447833588488';
const CRS_EMAIL = 'info@carparkrepair.co.uk';

// ==========================================
// SMS NOTIFICATIONS
// ==========================================

class CRSNotifications {
    
    // 1. Quote Ready SMS
    async sendQuoteSMS(phone, quote) {
        const message = `CRS Quote ${quote.reference}:\n` +
            `Repair Zone: ${quote.zoneSize}\n` +
            `Price: £${quote.finalPrice}\n` +
            `Valid 30 days\n` +
            `Reply YES to book or call 07833588488`;
        
        return this.sendSMS(phone, message);
    }
    
    // 2. Booking Confirmation SMS
    async sendBookingConfirmation(phone, job) {
        const message = `CRS Booking Confirmed!\n` +
            `Date: ${this.formatDate(job.scheduledDate)}\n` +
            `Ref: ${job.reference}\n` +
            `We'll text you the day before with arrival time\n` +
            `Questions? 07833588488`;
        
        return this.sendSMS(phone, message);
    }
    
    // 3. Day Before Reminder
    async sendDayBeforeReminder(phone, job) {
        const message = `CRS Reminder: We're repairing your car park tomorrow\n` +
            `Arrival: ${job.arrivalWindow}\n` +
            `Please ensure the area is clear of vehicles\n` +
            `We'll text when we're 30 mins away`;
        
        return this.sendSMS(phone, message);
    }
    
    // 4. On The Way SMS
    async sendOnTheWay(phone, job, minutesAway = 30) {
        const message = `CRS crew is ${minutesAway} minutes away from your car park\n` +
            `Please ensure access is available\n` +
            `Track: carparkrepair.co.uk/track/${job.reference}`;
        
        return this.sendSMS(phone, message);
    }
    
    // 5. Arrival SMS
    async sendArrivalNotification(phone, job) {
        const message = `CRS crew has arrived at your car park\n` +
            `Work will take approximately ${job.estimatedDuration}\n` +
            `We'll notify you when complete`;
        
        return this.sendSMS(phone, message);
    }
    
    // 6. Completion SMS
    async sendCompletionNotification(phone, job, invoice) {
        const message = `CRS has completed your car park repairs!\n` +
            `Invoice: ${invoice.url}\n` +
            `Amount: £${invoice.amount}\n` +
            `5-year warranty now active\n` +
            `Thank you for choosing CRS`;
        
        return this.sendSMS(phone, message);
    }
    
    // 7. Payment Reminder
    async sendPaymentReminder(phone, invoice, daysOverdue) {
        const message = `CRS Payment Reminder\n` +
            `Invoice ${invoice.number} (£${invoice.amount}) is ${daysOverdue} days overdue\n` +
            `Pay online: ${invoice.paymentUrl}\n` +
            `Questions? 07833588488`;
        
        return this.sendSMS(phone, message);
    }
    
    // 8. Review Request (3 days after completion)
    async sendReviewRequest(phone, job) {
        const message = `How was your CRS car park repair?\n` +
            `Please leave a quick review:\n` +
            `carparkrepair.co.uk/review/${job.reference}\n` +
            `Your feedback helps us improve!`;
        
        return this.sendSMS(phone, message);
    }
    
    // 9. Proximity Offer
    async sendProximityOffer(phone, location, discount) {
        const message = `CRS Special Offer!\n` +
            `We're working near ${location} this week\n` +
            `Get ${discount}% off car park repairs\n` +
            `Quote code: NEARBY${discount}\n` +
            `Valid 7 days. Call 07833588488`;
        
        return this.sendSMS(phone, message);
    }
    
    // 10. Weather Alert
    async sendWeatherAlert(phone, job) {
        const message = `CRS Weather Update\n` +
            `Rain forecast may delay your repair on ${this.formatDate(job.scheduledDate)}\n` +
            `We'll confirm by 7am on the day\n` +
            `No charge if we need to reschedule`;
        
        return this.sendSMS(phone, message);
    }
    
    // ==========================================
    // EMAIL NOTIFICATIONS
    // ==========================================
    
    // 1. Detailed Quote Email
    async sendQuoteEmail(email, quote, photos = []) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #003366; color: white; padding: 20px; text-align: center;">
                    <h1>CRS Car Park Repair Quote</h1>
                </div>
                
                <div style="padding: 20px; background: #f5f5f5;">
                    <h2>Quote Reference: ${quote.reference}</h2>
                    
                    <table style="width: 100%; background: white; padding: 15px;">
                        <tr>
                            <td><strong>Company:</strong></td>
                            <td>${quote.companyName}</td>
                        </tr>
                        <tr>
                            <td><strong>Location:</strong></td>
                            <td>${quote.address}, ${quote.postcode}</td>
                        </tr>
                        <tr>
                            <td><strong>Repair Zone:</strong></td>
                            <td>${quote.zoneSize} (up to ${quote.areaSqm}m²)</td>
                        </tr>
                        <tr>
                            <td><strong>Base Price:</strong></td>
                            <td>£${quote.basePrice}</td>
                        </tr>
                        ${quote.discount ? `
                        <tr style="color: green;">
                            <td><strong>Proximity Discount:</strong></td>
                            <td>-${quote.discount}%</td>
                        </tr>
                        ` : ''}
                        <tr style="font-size: 1.2em; font-weight: bold;">
                            <td><strong>Total Price:</strong></td>
                            <td>£${quote.finalPrice}</td>
                        </tr>
                    </table>
                    
                    <div style="background: white; padding: 15px; margin-top: 20px;">
                        <h3>What's Included:</h3>
                        <ul>
                            <li>Complete repair of ALL potholes in the zone</li>
                            <li>Professional-grade materials</li>
                            <li>5-year warranty</li>
                            <li>Same-day completion</li>
                            <li>No hidden charges</li>
                        </ul>
                    </div>
                    
                    <div style="background: white; padding: 15px; margin-top: 20px;">
                        <h3>Next Steps:</h3>
                        <p>This quote is valid for 30 days until ${this.formatDate(quote.validUntil)}</p>
                        <p>To proceed with the repair:</p>
                        <ol>
                            <li>Reply to this email with your preferred dates</li>
                            <li>Call us on 07833588488</li>
                            <li>Book online at carparkrepair.co.uk/book/${quote.reference}</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://carparkrepair.co.uk/book/${quote.reference}" 
                           style="background: #FF6B35; color: white; padding: 15px 30px; 
                                  text-decoration: none; font-size: 18px; border-radius: 5px;">
                            Book This Repair
                        </a>
                    </div>
                </div>
                
                <div style="background: #003366; color: white; padding: 20px; text-align: center; margin-top: 30px;">
                    <p>CRS - The Original Car Park Repair Specialists</p>
                    <p>📞 07833588488 | ✉️ info@carparkrepair.co.uk</p>
                    <p>Established Coventry Business | 5-Year Guarantee</p>
                </div>
            </div>
        `;
        
        return this.sendEmail(email, `Your CRS Quote: ${quote.reference}`, html);
    }
    
    // 2. Invoice Email
    async sendInvoiceEmail(email, invoice, job) {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #003366; color: white; padding: 20px;">
                    <h1>CRS Invoice</h1>
                    <p>Invoice Number: ${invoice.number}</p>
                </div>
                
                <div style="padding: 20px; background: #f5f5f5;">
                    <h2>Work Completed</h2>
                    <p>Date: ${this.formatDate(job.completedAt)}</p>
                    <p>Location: ${job.address}</p>
                    
                    <table style="width: 100%; background: white; padding: 15px;">
                        <tr>
                            <th style="text-align: left;">Description</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                        <tr>
                            <td>Car Park Pothole Repairs - ${job.zoneSize} zone</td>
                            <td style="text-align: right;">£${invoice.netAmount}</td>
                        </tr>
                        <tr>
                            <td>VAT (20%)</td>
                            <td style="text-align: right;">£${invoice.vatAmount}</td>
                        </tr>
                        <tr style="font-weight: bold; font-size: 1.2em;">
                            <td>Total Due</td>
                            <td style="text-align: right;">£${invoice.totalAmount}</td>
                        </tr>
                    </table>
                    
                    <div style="background: white; padding: 15px; margin-top: 20px;">
                        <h3>Payment Options:</h3>
                        <ul>
                            <li>Bank Transfer: Sort Code: 12-34-56, Account: 12345678</li>
                            <li>Online: carparkrepair.co.uk/pay/${invoice.number}</li>
                            <li>Phone: Call 07833588488 to pay by card</li>
                        </ul>
                        <p><strong>Payment Terms:</strong> ${invoice.terms}</p>
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 15px; margin-top: 20px;">
                        <h3>✅ Your 5-Year Warranty is Now Active</h3>
                        <p>Warranty expires: ${this.formatDate(job.warrantyExpiry)}</p>
                        <p>Keep this invoice as proof of warranty</p>
                    </div>
                </div>
            </div>
        `;
        
        return this.sendEmail(email, `CRS Invoice ${invoice.number}`, html);
    }
    
    // ==========================================
    // CORE SEND FUNCTIONS
    // ==========================================
    
    async sendSMS(phone, message) {
        try {
            // Clean phone number
            phone = this.cleanPhoneNumber(phone);
            
            const result = await twilioClient.messages.create({
                body: message,
                from: CRS_PHONE,
                to: phone
            });
            
            console.log(`SMS sent to ${phone}: ${result.sid}`);
            return { success: true, messageId: result.sid };
            
        } catch (error) {
            console.error('SMS failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    async sendEmail(to, subject, html) {
        try {
            const msg = {
                to,
                from: CRS_EMAIL,
                subject,
                html,
                text: html.replace(/<[^>]*>/g, '') // Strip HTML for text version
            };
            
            await sgMail.send(msg);
            console.log(`Email sent to ${to}: ${subject}`);
            return { success: true };
            
        } catch (error) {
            console.error('Email failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    cleanPhoneNumber(phone) {
        // Remove spaces and ensure UK format
        phone = phone.replace(/\s/g, '');
        if (phone.startsWith('07')) {
            phone = '+44' + phone.substring(1);
        }
        return phone;
    }
    
    formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    
    // ==========================================
    // BULK MESSAGING
    // ==========================================
    
    async sendBulkProximityOffers(customers, location, discount) {
        const results = [];
        
        for (const customer of customers) {
            if (customer.phone && customer.optedIn) {
                const result = await this.sendProximityOffer(
                    customer.phone,
                    location,
                    discount
                );
                results.push({ customer: customer.id, ...result });
                
                // Rate limiting - wait 1 second between messages
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return results;
    }
}

module.exports = new CRSNotifications();