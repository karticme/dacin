use grammers_client::tl;
use grammers_session::types::PeerRef;

const DACIN_FOLDER_TITLE: &str = "@dacin";

fn make_title(text: &str) -> tl::enums::TextWithEntities {
    tl::enums::TextWithEntities::Entities(tl::types::TextWithEntities {
        text: text.to_string(),
        entities: vec![],
    })
}

fn filter_title_text(filter: &tl::enums::DialogFilter) -> Option<String> {
    match filter {
        tl::enums::DialogFilter::Filter(f) => {
            let tl::enums::TextWithEntities::Entities(t) = &f.title;
            Some(t.text.clone())
        }
        tl::enums::DialogFilter::Chatlist(f) => {
            let tl::enums::TextWithEntities::Entities(t) = &f.title;
            Some(t.text.clone())
        }
        tl::enums::DialogFilter::Default => None,
    }
}

fn filter_id(filter: &tl::enums::DialogFilter) -> Option<i32> {
    match filter {
        tl::enums::DialogFilter::Filter(f) => Some(f.id),
        tl::enums::DialogFilter::Chatlist(f) => Some(f.id),
        tl::enums::DialogFilter::Default => None,
    }
}

fn filter_include_peers(filter: &tl::enums::DialogFilter) -> Vec<tl::enums::InputPeer> {
    match filter {
        tl::enums::DialogFilter::Filter(f) => f.include_peers.clone(),
        tl::enums::DialogFilter::Chatlist(f) => f.include_peers.clone(),
        tl::enums::DialogFilter::Default => vec![],
    }
}

fn peer_channel_id(peer: &tl::enums::InputPeer) -> Option<i64> {
    match peer {
        tl::enums::InputPeer::Channel(c) => Some(c.channel_id),
        _ => None,
    }
}

async fn get_all_filters(
    client: &grammers_client::Client,
) -> Result<Vec<tl::enums::DialogFilter>, String> {
    let result = client
        .invoke(&tl::functions::messages::GetDialogFilters {})
        .await
        .map_err(|e| format!("Failed to get dialog filters: {e}"))?;
    let tl::enums::messages::DialogFilters::Filters(f) = result;
    Ok(f.filters)
}

fn empty_dacin_filter(id: i32) -> tl::enums::DialogFilter {
    tl::enums::DialogFilter::Filter(tl::types::DialogFilter {
        contacts: false,
        non_contacts: false,
        groups: false,
        broadcasts: false,
        bots: false,
        exclude_muted: false,
        exclude_read: false,
        exclude_archived: false,
        title_noanimate: false,
        id,
        title: make_title(DACIN_FOLDER_TITLE),
        emoticon: None,
        color: None,
        pinned_peers: vec![],
        include_peers: vec![],
        exclude_peers: vec![],
    })
}

/// Adds `peer` to the @dacin folder's include_peers (creates folder if needed; idempotent).
pub(crate) async fn add_peer_to_folder(
    client: &grammers_client::Client,
    peer: &PeerRef,
) -> Result<(), String> {
    let mut filters = get_all_filters(client).await?;

    let input_peer = tl::enums::InputPeer::Channel(tl::types::InputPeerChannel {
        channel_id: peer.id.bare_id(),
        access_hash: peer.auth.hash(),
    });

    let dacin_idx = filters
        .iter()
        .position(|f| filter_title_text(f).as_deref() == Some(DACIN_FOLDER_TITLE));

    let folder_id = match dacin_idx {
        Some(idx) => {
            // Already exists — skip if peer is already in it
            if filter_include_peers(&filters[idx])
                .iter()
                .any(|p| peer_channel_id(p) == Some(peer.id.bare_id()))
            {
                return Ok(());
            }
            let id = filter_id(&filters[idx]).unwrap();
            if let tl::enums::DialogFilter::Filter(ref mut f) = filters[idx] {
                f.include_peers.push(input_peer);
                let updated = filters[idx].clone();
                client
                    .invoke(&tl::functions::messages::UpdateDialogFilter {
                        id,
                        filter: Some(updated),
                    })
                    .await
                    .map_err(|e| format!("Failed to update @dacin folder: {e}"))?;
            }
            id
        }
        None => {
            let used_ids: Vec<i32> = filters.iter().filter_map(filter_id).collect();
            let new_id = (2i32..=255)
                .find(|id| !used_ids.contains(id))
                .ok_or_else(|| "No available folder ID slot".to_string())?;

            let mut new_filter = empty_dacin_filter(new_id);
            if let tl::enums::DialogFilter::Filter(ref mut f) = new_filter {
                f.include_peers.push(input_peer);
            }

            client
                .invoke(&tl::functions::messages::UpdateDialogFilter {
                    id: new_id,
                    filter: Some(new_filter),
                })
                .await
                .map_err(|e| format!("Failed to create @dacin folder: {e}"))?;

            eprintln!("[folder] Created @dacin folder with id={new_id}");
            new_id
        }
    };

    eprintln!("[folder] Added channel {} to folder {}", peer.id.bare_id(), folder_id);
    Ok(())
}

/// Removes a channel from the @dacin folder's include_peers.
pub(crate) async fn remove_peer_from_folder(
    client: &grammers_client::Client,
    channel_id: i64,
) -> Result<(), String> {
    let mut filters = get_all_filters(client).await?;

    let dacin_idx = filters
        .iter()
        .position(|f| filter_title_text(f).as_deref() == Some(DACIN_FOLDER_TITLE));

    let Some(idx) = dacin_idx else {
        return Ok(());
    };

    let folder_id = filter_id(&filters[idx]).unwrap();

    if let tl::enums::DialogFilter::Filter(ref mut f) = filters[idx] {
        let before = f.include_peers.len();
        f.include_peers.retain(|p| peer_channel_id(p) != Some(channel_id));
        if f.include_peers.len() == before {
            return Ok(());
        }
        let updated = filters[idx].clone();
        client
            .invoke(&tl::functions::messages::UpdateDialogFilter {
                id: folder_id,
                filter: Some(updated),
            })
            .await
            .map_err(|e| format!("Failed to update @dacin folder: {e}"))?;
    }

    eprintln!("[folder] Removed channel {channel_id} from folder {folder_id}");
    Ok(())
}

/// Returns the list of channel peers stored in the @dacin folder.
/// Returns an empty vec if the folder doesn't exist yet.
pub(crate) async fn list_folder_peers(
    client: &grammers_client::Client,
) -> Result<Vec<tl::enums::InputPeer>, String> {
    let filters = get_all_filters(client).await?;
    for filter in &filters {
        if filter_title_text(filter).as_deref() == Some(DACIN_FOLDER_TITLE) {
            return Ok(filter_include_peers(filter));
        }
    }
    Ok(vec![])
}
