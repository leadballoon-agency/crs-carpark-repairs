// Client-side image validation
// Quick checks before sending to server

function validateCarParkImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Basic client-side checks
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 100;
                canvas.height = 100;
                ctx.drawImage(img, 0, 0, 100, 100);
                
                const imageData = ctx.getImageData(0, 0, 100, 100);
                const data = imageData.data;
                
                // Analyze colors
                let greyCount = 0;
                let skinToneCount = 0;
                
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Check for asphalt/concrete colors (greys and dark colors)
                    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r < 150) {
                        greyCount++;
                    }
                    
                    // Check for skin tones (indicates people)
                    if (r > 100 && g > 70 && b > 50 && r > b && r > g) {
                        skinToneCount++;
                    }
                }
                
                const totalPixels = data.length / 4;
                const greyPercentage = (greyCount / totalPixels) * 100;
                const skinPercentage = (skinToneCount / totalPixels) * 100;
                
                // Validation rules
                if (skinPercentage > 20) {
                    resolve({
                        valid: false,
                        reason: 'Photo appears to contain people',
                        suggestion: 'Please upload a photo of your car park surface',
                        confidence: 'high'
                    });
                } else if (greyPercentage < 10) {
                    resolve({
                        valid: false,
                        reason: 'This doesn\'t look like a car park',
                        suggestion: 'Make sure the photo shows asphalt or concrete',
                        confidence: 'medium'
                    });
                } else {
                    resolve({
                        valid: true,
                        confidence: 'proceed'
                    });
                }
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}

// Enhanced validation with quick pre-checks
async function smartImageValidation(file) {
    // Check file name for obvious non-car-park images
    const filename = file.name.toLowerCase();
    const suspiciousWords = ['selfie', 'portrait', 'face', 'person', 'people', 'group', 'family', 'hair', 'head'];
    
    for (const word of suspiciousWords) {
        if (filename.includes(word)) {
            return {
                valid: false,
                reason: 'Filename suggests this is not a car park photo',
                suggestion: 'Please select a photo of your car park'
            };
        }
    }
    
    // Check file size (car park photos are usually larger)
    if (file.size < 50000) { // Less than 50KB
        return {
            valid: false,
            reason: 'Image too small',
            suggestion: 'Please upload a clearer photo of your car park'
        };
    }
    
    // Do color analysis
    return await validateCarParkImage(file);
}

// Update the existing upload handler
window.validateBeforeUpload = async function(file) {
    const validation = await smartImageValidation(file);
    
    if (!validation.valid) {
        // Show friendly error
        const alertDiv = document.createElement('div');
        alertDiv.className = 'validation-alert';
        alertDiv.innerHTML = `
            <div style="background: #FEE2E2; border: 2px solid #EF4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #B91C1C; margin: 0 0 10px 0;">❌ Oops! That's not a car park</h3>
                <p style="color: #7F1D1D; margin: 5px 0;">${validation.reason}</p>
                <p style="color: #991B1B; font-weight: bold; margin: 10px 0 0 0;">${validation.suggestion}</p>
            </div>
        `;
        
        // Insert after upload area
        const uploadArea = document.querySelector('.upload-area');
        uploadArea.parentNode.insertBefore(alertDiv, uploadArea.nextSibling);
        
        // Remove after 5 seconds
        setTimeout(() => alertDiv.remove(), 5000);
        
        return false;
    }
    
    return true;
};