// Thêm môn học. body: { domain, subjCode, subjName, code, type, stage, prg }
import { SUBJECT_MENU_KEY, SUBJECT_BUTTONS } from '~/data/schemas/subjectSchema'
import { validateSubjectForm, toSubjectPayload } from '~/data/transformers/subjectTransformer'

export default defineEventHandler(async (event) => {
  const { email } = await requireAdminAccess(event, SUBJECT_MENU_KEY, SUBJECT_BUTTONS.SAVE)
  const body = (await readBody(event)) || {}
  const domain = await resolveSubjectDomain(event, email, body.domain)

  const err = validateSubjectForm(body)
  if (err) throwInvalid(err)
  const { prg, subjCode, obj } = toSubjectPayload(body)

  const subject = await rpcOrThrow(event, 'create_subject', {
    p_domain: domain, p_prg: prg, p_subj_code: subjCode, p_obj: obj,
  })
  return { subject }
})
