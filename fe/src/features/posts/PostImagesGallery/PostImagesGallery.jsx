import styles from "./PostImagesGallery.module.css";

function PostImagesGallery({ images = [], className = "" }) {
  const list = (images ?? []).filter((image) => image?.url);
  if (list.length === 0) return null;

  return (
    <div className={[styles.images, className].filter(Boolean).join(" ")} aria-label="Ảnh bài viết">
      {list.map((image) => (
        <img
          key={image.id ?? image.url}
          src={image.url}
          alt=""
          className={styles.image}
          loading="lazy"
        />
      ))}
    </div>
  );
}

export default PostImagesGallery;
