
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const frmAccount = body.from || 'system@westernsydney.edu.vn'
  const appPSW = frmAccount.includes('system') ? process.env.MAIL_PSW_FALLBACK : process.env.MAIL_PSW_WSUPRG

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: frmAccount, 
      pass: appPSW,         
    },
  })

  let fullHtml = body.message
  const attachments = []
  if (body.attachment && body.attachment.content) {
    attachments.push({
      filename: body.attachment.filename,
      content: body.attachment.content, 
      encoding: 'base64',               
    })
  }

  // Convert links into clickable list items
  if (body.links){
    const linksHtml = body.links
      .map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`)
      .join('')

    fullHtml = `
      <p>${body.message}</p>
      <ul>${linksHtml}</ul>
    `
  }

  const mailOptions = {
    from: `${body.alias} <${frmAccount}`,
    to: body.to,
    cc: body.cc ? body.cc : undefined,
    subject: body.subject,
    attachments: attachments.length > 0 ? attachments : undefined,
    html: fullHtml,
  }
  try {
    const info = await transporter.sendMail(mailOptions)
    return { success: true, info }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
})