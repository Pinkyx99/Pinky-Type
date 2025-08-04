import { LeaderboardEntry, GameConfig } from '../types';
import { supabase, type Database } from './supabaseClient';

const MAX_SCORES_PER_CATEGORY = 10;

// --- Helper to get a unique key for each game mode config ---
export const getLeaderboardCategoryKey = (config: GameConfig): string => {
    if (config.mode === 'zen') return 'zen';
    return `${config.mode}-${config.value}`;
};

// --- Fetches the top 10 scores for a given category from Supabase ---
export const getScoresForCategory = async (categoryKey: string): Promise<LeaderboardEntry[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('scores')
        .select('*') // Using select('*') to ensure all fields are fetched and simplify type inference.
        .eq('category', categoryKey)
        .order('wpm', { ascending: false })
        .limit(MAX_SCORES_PER_CATEGORY);
    
    if (error) {
        console.error("Error fetching scores:", error);
        throw new Error(`Could not fetch scores: ${error.message}`);
    }
    // With corrected types, `data` is correctly inferred and `as any` is not needed.
    return data || [];
};

// --- Fetches a user's personal best WPM for a given category ---
export const getPersonalBest = async (name: string, categoryKey: string): Promise<number | null> => {
    if (!supabase) return null;

    // Use `ilike` for case-insensitive matching to be robust against any legacy data
    // that might not have been stored in lowercase.
    const { data, error } = await supabase
        .from('scores')
        .select('wpm')
        .ilike('name', name) // Use case-insensitive matching
        .eq('category', categoryKey)
        .order('wpm', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching personal best:", error);
        throw new Error(`Could not fetch personal best: ${error.message}`);
    }

    return data ? data.wpm : null;
};


// --- Saves a new entry to the leaderboard in Supabase ---
export const saveScoreToLeaderboard = async (entry: Database['public']['Tables']['scores']['Insert']) => {
    if (!supabase) return;

    // --- Robust Upsert Logic ---
    // 1. Find all existing scores for this user and category. Names are lowercase, but we use ilike to be safe.
    const { data: existingScores, error: findError } = await supabase
        .from('scores')
        .select('id')
        .ilike('name', entry.name)
        .eq('category', entry.category);

    if (findError) {
        console.error('Error finding existing scores:', findError.message);
        throw new Error('Could not check for existing scores.');
    }

    // 2. If any old scores exist, delete them by their specific IDs.
    if (existingScores && existingScores.length > 0) {
        const idsToDelete = existingScores.map(score => score.id);
        const { error: deleteError } = await supabase
            .from('scores')
            .delete()
            .in('id', idsToDelete);
        
        if (deleteError) {
            console.error('Error clearing previous scores:', deleteError.message);
            throw new Error('Could not clear previous scores before saving.');
        }
    }

    // 3. Insert the new high score record. This is now the only record for this user/category.
    const { error: insertError } = await supabase
        .from('scores')
        .insert([entry]);

    if (insertError) {
        console.error('Error inserting new score:', insertError.message);
        throw new Error(`Failed to save new score: ${insertError.message}`);
    }
};


// --- Checks if a username is already taken in the leaderboard ---
export const isUsernameTaken = async (name: string): Promise<boolean> => {
    if (!supabase) return false;

    // Name is expected to be lowercase, but check is case-insensitive to be robust.
    const { count, error } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true }) // Get count without fetching data
        .ilike('name', name); // Case-insensitive check is more robust

    if (error) {
        console.error("Error checking username:", error);
        throw new Error(`Could not verify username: ${error.message}`);
    }

    return (count ?? 0) > 0;
};