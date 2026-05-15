import QRCode from 'qrcode';
import Poll from '../models/Poll.js';

export async function getPollQR(req, res, next) {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    const pollUrl = `${process.env.CLIENT_URL}/p/${poll.slug}`;
    const dataUrl = await QRCode.toDataURL(pollUrl);
    // Return as PNG buffer
    const img = dataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(img, 'base64');
    res.set('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    return next(error);
  }
}
