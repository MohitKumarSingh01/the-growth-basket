module.exports = async function handler(req, res) {
  res.status(200).json({ ok: true, service: 'The Growth Basket backend', time: new Date().toISOString() });
};
