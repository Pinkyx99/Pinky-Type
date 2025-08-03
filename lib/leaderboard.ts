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
    // The Row type for 'scores' is identical to LeaderboardEntry.
    return (data as any) || [];
};

// --- Fetches a user's personal best WPM for a given category ---
export const getPersonalBest = async (name: string, categoryKey: string): Promise<number | null> => {
    if (!supabase) return null;

    // .maybeSingle() returns one object or null, which simplifies logic.
    const { data, error } = await supabase
        .from('scores')
        .select('wpm')
        .eq('name', name)
        .eq('category', categoryKey)
        .order('wpm', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching personal best:", error);
        throw new Error(`Could not fetch personal best: ${error.message}`);
    }

    return data ? (data as any).wpm : null;
};


// --- Saves a new entry to the leaderboard in Supabase ---
export const saveScoreToLeaderboard = async (entry: Database['public']['Tables']['scores']['Insert']) => {
    if (!supabase) return;

    // Using .maybeSingle() to fetch one record or null, simplifies logic.
    const { data: existing, error: selectError } = await supabase
        .from('scores')
        .select('id, wpm')
        .eq('name', entry.name)
        .eq('category', entry.category)
        .maybeSingle();

    if (selectError) {
        throw new Error(`Could not check for existing score: ${selectError.message}`);
    }

    if (existing) {
        // Only update if the new WPM is higher
        if (entry.wpm > (existing as any).wpm) {
            const { error: updateError } = await supabase
                .from('scores')
                .update({ wpm: entry.wpm, accuracy: entry.accuracy } as any)
                .eq('id', (existing as any).id);
            if (updateError) {
                 throw new Error(`Failed to update score: ${updateError.message}`);
            }
        }
    } else {
        // Insert a new record
        const { error: insertError } = await supabase.from('scores').insert(entry as any);
        if (insertError) {
            throw new Error(`Failed to save score: ${insertError.message}`);
        }
    }
};

// --- Checks if a username is already taken in the leaderboard ---
export const isUsernameTaken = async (name: string): Promise<boolean> => {
    if (!supabase) return false;

    const { count, error } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true }) // Get count without fetching data
        .ilike('name', name); // Case-insensitive match

    if (error) {
        console.error("Error checking username:", error);
        throw new Error(`Could not verify username: ${error.message}`);
    }

    return (count ?? 0) > 0;
};