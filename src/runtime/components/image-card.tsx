/** @jsx jsx */
import { jsx } from "jimu-core";
import { styled } from "jimu-theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "../utils/utils";



const ImageContainer = styled.div`
  position: relative;
`;

const ImageCaption = styled.p`
  position: absolute;
  bottom: 3px;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.6);
  color: black;
  text-align: center;
  padding: 10px 5px;
`;

const Image = styled.img`
  width: 200px;
`;

const useIntersection = (element, rootMargin) => {
  const [isVisible, setState] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setState(entry.isIntersecting);
      }, { rootMargin }
    );

    element.current && observer.observe(element.current);

    return () => observer.unobserve(element.current);
  }, []);

  return isVisible;
};

export function ImageCard(props) {
  const { record, onClick, selected, sortField } = props;
  const recordId = record.getId();

  const [imgSrc, setImgSrc] = useState(null);
  const ref = useRef();
  const inViewport = useIntersection(ref, '0px');

  useMemo(() => {
    if ((inViewport) && !imgSrc) {
      record.queryAttachments()
        .then(record => setImgSrc(record[0].url));
    }
  }, [inViewport]);

  return <ImageContainer
    key={recordId}
    data-id={recordId}
    style={selected ? { border: "3px solid rgba(0, 0, 255, 0.4)" } : {}}
    onClick={onClick}
    ref={ref}
  >
    <Image
      src={imgSrc}
    ></Image>
    <ImageCaption>{record.feature.attributes.Title}Created at {formatDate(record.feature.attributes[sortField])}</ImageCaption>
  </ImageContainer>
}