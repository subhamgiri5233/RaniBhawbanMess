// Bengali Font support for jsPDF
// This file will be imported and used in Calculator component

export const addBengaliFont = async (doc) => {
    try {
        // Fetch the font file
        const response = await fetch('/fonts/NotoSansBengali.ttf');
        const fontBlob = await response.blob();

        // Convert to base64
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                const base64Font = reader.result.split(',')[1];

                // Add the font to jsPDF
                doc.addFileToVFS('NotoSansBengali.ttf', base64Font);
                doc.addFont('NotoSansBengali.ttf', 'NotoSansBengali', 'normal');

                resolve();
            };

            reader.onerror = reject;
            reader.readAsDataURL(fontBlob);
        });
    } catch (error) {
        console.error('Failed to load Bengali font:', error);
        // Fallback to default font if Bengali font fails to load
        return Promise.resolve();
    }
};
