FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install build deps (docker compose up -d --build: forces building the local mjpg-streamer image.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    libjpeg-dev \
    libv4l-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    cmake \
    pkg-config \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

# Clone a maintained mjpg-streamer fork and build
RUN git clone https://github.com/jacksonliam/mjpg-streamer.git \
 && cd mjpg-streamer/mjpg-streamer-experimental \
 && make all

EXPOSE 8080
## Install built artifacts to locations the compose command expects
RUN cd mjpg-streamer/mjpg-streamer-experimental \
 && mkdir -p /usr/local/bin /usr/local/lib /usr/local/www \
 && cp mjpg_streamer /usr/local/bin/ \
 && cp input_*.so output_*.so /usr/local/lib/ || true \
 && cp -r www /usr/local/www || true \
 && chmod +x /usr/local/bin/mjpg_streamer

# Default command (compose overrides it but keep a sensible default)
CMD ["/usr/local/bin/mjpg_streamer", "-i", "/usr/local/lib/input_uvc.so -y -r 1280x720 -f 15", "-o", "/usr/local/lib/output_http.so -p 8080 -w /usr/local/www"]
