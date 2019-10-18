if [ ! -d /work/assets/purecss ]
then
     cp -R /tmp/purecss /work/assets/style
     chown -R ${HOST_UID}:${HOST_GID} /work/assets/style/purecss
fi

hugo $*
