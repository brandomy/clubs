import { logger } from '../utils/logger'
import { supabase } from './supabase'

export async function checkDuplicateSpeaker(
  email: string | null,
  excludeId?: string
): Promise<{ isDuplicate: boolean; existing: any | null }> {
  if (!email || email.trim() === '') {
    return { isDuplicate: false, existing: null }
  }

  let query = supabase
    .from('speakers')
    .select('id, name, email, organization, status')
    .eq('email', email.trim().toLowerCase())

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    logger.error('Error checking duplicate:', error)
    return { isDuplicate: false, existing: null }
  }

  return {
    isDuplicate: !!data,
    existing: data,
  }
}

export async function checkDuplicateMember(
  email: string | null,
  excludeId?: string
): Promise<{ isDuplicate: boolean; existing: any | null }> {
  if (!email || email.trim() === '') {
    return { isDuplicate: false, existing: null }
  }

  let query = supabase
    .from('members')
    .select('id, name, email, roles')
    .eq('email', email.trim().toLowerCase())

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    logger.error('Error checking duplicate:', error)
    return { isDuplicate: false, existing: null }
  }

  return {
    isDuplicate: !!data,
    existing: data,
  }
}
