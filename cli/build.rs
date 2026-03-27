use std::fs;
use std::path::Path;

fn main() {
    let src_dir = Path::new("../manifests");
    let dst_dir = Path::new("manifests");

    // Only copy if building from the repo (not from crate tarball)
    if src_dir.exists() {
        fs::create_dir_all(dst_dir).expect("Failed to create manifests dir");

        for entry in fs::read_dir(src_dir).expect("Failed to read manifests dir") {
            let entry = entry.expect("Failed to read entry");
            let path = entry.path();
            if path.extension().is_some_and(|e| e == "yaml" || e == "yml") {
                let dest = dst_dir.join(path.file_name().unwrap());
                fs::copy(&path, &dest).expect("Failed to copy manifest");
            }
        }
    }

    println!("cargo:rerun-if-changed=../manifests");
}
