export default function rejectUserId(req, res, next) {
  if (
    Object.hasOwn(req.body ?? {}, 'user_id') ||
    Object.hasOwn(req.query ?? {}, 'user_id')
  ) {
    return res.status(400).json({
      status: 'fail',
      message: 'user_id tidak boleh dikirim oleh klien.',
      data: {},
    })
  }
  return next()
}
